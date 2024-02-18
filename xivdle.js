//Declare initial variables
let dutyList = [];
let dutyToGuess;
let dutyToGuessIndex;
let gameIsActive = true;
let lives = 10;

//Load Duty Data from JSON
fetch('./duties.json')
    .then((response) => {
        if(!response.ok){
            throw new Error('Response not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        dutyList = data;
        initializeGame();
    })
    .catch(error => {
        console.error("Error during fetch operation: ", error);
    });

//Seeded PRNG, splitmix32 algorithm
//https://github.com/bryc/code/blob/master/jshash/PRNGs.md
function splitmix32(a) {
    return function() {
        a |= 0; a = a + 0x9e3779b9 | 0;
        var t = a ^ a >>> 16; t = Math.imul(t, 0x21f0aaad);
            t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
}

function initializeGame(){
    autocomplete(document.getElementById("guessEntry"), dutyList);
    dutyToGuessIndex = generateDutyOfTheDay();
    dutyToGuess = dutyList[dutyToGuessIndex];
}

function generateDutyOfTheDay(){
    let now = new Date();
    let epochDays = Math.floor(now/8.64e7);
    console.log("Epoch Day: " + epochDays);
    let randomNumber = splitmix32(epochDays)();
    //check number of digits in the float randomNumber
    var length = (randomNumber + '').replace('.', '').length;
    //multiply float randomNumber by 10^x where x is the number of digits minus one, this converts the number to a integer
    randomNumber = randomNumber*Math.pow(10, length-1)
    console.log(randomNumber)
    let dutyNumber = randomNumber%dutyList.length
    console.log(dutyNumber)
    console.log(dutyList[dutyNumber].dutyName);
    return dutyNumber;
}

function updateLivesCount(){
    const livesField = document.getElementById("lives");
    let hearts = ""
    for(let i = 0; i < lives; i++){
        hearts += "❤️";
    }
    livesField.innerHTML = hearts;
}

function autocomplete(inp, arr) {
    var currentFocus;

    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /* Close any open lists */
        closeAllLists();
        if(!val) return false;
        currentFocus = -1;
        /* Create a DIV element that contains values */
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete.list");
        a.setAttribute("class", "autocomplete-items");
        /* Append DIV element to autocomplete container */
        this.parentNode.appendChild(a);
        let autocompleteCount = 0;
        for(let i = 0; i <= arr.length; i++){
            arrItem = arr[i];
            if(arrItem.dutyName.substr(0, val.length).toLowerCase() == val.toLowerCase()){
                b = document.createElement("DIV");
                /* Make matching letter bold */
                b.innerHTML = "<strong>" + arrItem.dutyName.substr(0, val.length) +  "</strong>"
                b.innerHTML += arrItem.dutyName.substr(val.length)

                b.innerHTML += "<input type='hidden' value='" + arrItem + "'>";
                /* execute function when someone clicks an item */
                b.addEventListener("click", function(e) {
                    /*insert the value to the text field */
                    inp.value =  arrItem.dutyName;
                    /*Close the list of autocompletes */
                    closeAllLists();
                });
                a.appendChild(b);
                autocompleteCount++;
                if(autocompleteCount >= 10) break;
            }
        }
    });

    function addActive(x){
        /* function to classify an item as active */
        if(!x) return false;
        removeActive(x);
        if(currentFocus >= x.length) currentFocus = 0;
        if(currentFocus < 0) currentFocuse = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x){
        /* function to remove the active classification an item */
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(element){
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++){
            if(element != x[i] && element != inp){
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}

function createDutyList(){
    const dataList = document.getElementById("duty-titles")

    dutyList.forEach(duty => {
        const option = document.createElement("option");
        option.value = duty.dutyName;
        dataList.appendChild(option)
    })
}

function checkGuessValidity(guessToCheck){
    const validDuties = dutyList.map(duty => duty.dutyName.toLowerCase());
    if(!validDuties.includes(guessToCheck.toLowerCase())){
        alert("Invalid Duty, please selects a valid duty name from the autocomplete list");
        return false;
    }
    return true;
}

function guess(){
    if(!gameIsActive) return;
    console.log("guess button clicked");

    // UI Elements
    const input = document.getElementById("guessEntry");
    const guessButton = document.getElementById("guessButton");
    const tableBody = document.getElementById("guessTable").getElementsByTagName('tbody')[0];

    const guess = input.value;

    if(!checkGuessValidity(guess)) return;

    const guessedDuty = dutyList.find(duty => duty.dutyName.toLowerCase() == guess.toLowerCase())
    
    //create new row
    const newRow = tableBody.insertRow(0);
    newRow.classList.add("answerRow")
    //Handle each Data Point of the Guess
    Object.keys(dutyToGuess).forEach((key, i) => {
        //add datapoint from user's guess to Row
        const cell = newRow.insertCell(i);
        //assign basic answerCell class to new cells
        cell.classList.add("answerCell");
        cell.innerText = guessedDuty[key];
        if(key == 'instanceType'){
            const correctInstanceType = dutyToGuess.instanceType;
            const guessedInstanceType = guessedDuty.instanceType;
            if(correctInstanceType == guessedInstanceType){
                cell.classList.add("correctAnswerCell")
            }else{
                cell.classList.add("incorrectAnswerCell");
            }
            return;
        }

        if(key == 'partySize'){
            const correctPartySize = parseInt(dutyToGuess[key]);
            const guessedPartySize = parseInt(guessedDuty[key]);
            if(correctPartySize == guessedPartySize){
                cell.classList.add("correctAnswerCell")
            }else{
                cell.classList.add("incorrectAnswerCell");
            }
            return;
        }

        if(key == 'level'){
            const correctLevel = parseInt(dutyToGuess[key]);
            const guessedLevel = parseInt(guessedDuty[key]);
            if(correctLevel == guessedLevel){
                cell.classList.add("correctAnswerCell")
            }else{
                const levelDiff = correctLevel - guessedLevel;
                cell.classList.add("incorrectAnswerCell");
                cell.innerHTML += ` ${levelDiff < 0 ? '&#9660' : '&#9650'}`;
            }
            return;
        }

        if(key == 'minimumIL'){
            const correctIL = parseInt(dutyToGuess[key]);
            const guessedIL = parseInt(guessedDuty[key]);
            if(correctIL == guessedIL){
                cell.classList.add("correctAnswerCell");
            }else{
                const ilDiff = correctIL - guessedIL;
                if(Math.abs(ilDiff) <= 30){
                    cell.classList.add("incorrectCloseAnswerCell");
                    cell.innerHTML += ` ${ilDiff < 0 ? '&#9660' : '&#9650'}`;
                }else{
                    cell.classList.add("incorrectAnswerCell");
                    cell.innerHTML += ` ${ilDiff < 0 ? '&#9660' : '&#9650'}`;
                }
            }
            return;
        }

        if(key == 'patchReleased'){
            const correctPatch = parseFloat(dutyToGuess[key]);
            const guessedPatch = parseFloat(guessedDuty[key]);
            if(correctPatch == guessedPatch){
                cell.classList.add("correctAnswerCell")
            }else{
                const patchDiff = correctPatch - guessedPatch;
                cell.classList.add("incorrectAnswerCell");
                cell.innerHTML += ` ${patchDiff < 0 ? '&#9660' : '&#9650'}`;
            }
            return;
        }

        if(key == 'difficulty'){
            const correctDifficulty = dutyToGuess.difficulty;
            const guessedDifficulty = guessedDuty.difficulty;
            if(correctDifficulty == guessedDifficulty){
                cell.classList.add("correctAnswerCell");
            }else{
                cell.classList.add("incorrectAnswerCell");
            }
            return;
        }

        if(key == 'region'){
            const correctRegion = dutyToGuess.region;
            const guessedRegion = guessedDuty.region;
            if(correctRegion == guessedRegion){
                cell.classList.add("correctAnswerCell");
            }else{
                cell.classList.add("incorrectAnswerCell");
            }
            return;
        }

        if(key == 'questLine'){
            const correctQuestLine = dutyToGuess.questLine;
            const guessedQuestLine = guessedDuty.questLine;
            if(correctQuestLine == guessedQuestLine){
                cell.classList.add("correctAnswerCell");
            }else{
                cell.classList.add("incorrectAnswerCell");
            }
            return;
        }
    });

    //check overall answer correctness
    if(guessedDuty == dutyToGuess){
        setTimeout(function() {
            alert("WINNER! Congratulations on guessing the correct duty!");
            gameIsActive = false;
            input.disabled = true;
            guessButton.disabled = true;
        }, 300);
    }else{
        // remove a life for incorrect guess and check failstate
        lives--;
        updateLivesCount();
        if(lives <= 0) {
            setTimeout(function() {
                alert("Game Over, please try again tomorrow! The correct Duty was " + dutyToGuess.dutyName);
                gameIsActive = false;
                input.disabled = true;
                guessButton.disabled = true;
            }, 300);
        }
    }
    //reset input window
    input.value = "";
}