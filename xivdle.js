//Declare initial variables
let dutyList = [];
let dutyToGuess;
let dutyToGuessIndex;
let gameIsActive = true;
let lives = 10;
let epochDays;

//user score dictionary
let userScoresRecord;

//get ui elements
const resultsChart = document.getElementById("modalChart");
var modal = document.getElementById("resultsModal");
var span = document.getElementsByClassName("modal-close")[0];

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
    //initialize date
    let now = new Date();
    epochMins = now/60000;
    //account for local timezone
    epochDays = Math.floor((epochMins-now.getTimezoneOffset())/1440);
    ///initialize guessing and duty of the day
    autocomplete(document.getElementById("guessEntry"), dutyList);
    dutyToGuessIndex = generateDutyOfTheDay();
    dutyToGuess = dutyList[dutyToGuessIndex];
    //check for user score history
    checkUserScores();
    //check if user has already played today
    checkIfPlayed();
}

function checkUserScores(){
    if(localStorage.getItem("userScores")){
        userScoresRecord = JSON.parse(localStorage.getItem("userScores"));
    }else{
        userScoresRecord = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0};
    }
}

function checkIfPlayed(){
    if(localStorage.getItem(epochDays)){
        gameIsActive = false;
        document.getElementById("modalHeader").innerHTML = "Thank you for playing today! Your score was: " + localStorage.getItem(epochDays);
        //score chart
        generateStatChart();
        modal.style.display = "block";
    }
}

function gameOver(victoryBool){
    localStorage.setItem(epochDays, lives);
    userScoresRecord[lives]++;
    localStorage.setItem("userScores", JSON.stringify(userScoresRecord))
    if(victoryBool){
        document.getElementById("modalHeader").innerHTML = "Duty Complete! You have guessed the correct duty with " + lives + " lives remaining!"
        //score chart
        generateStatChart();
        modal.style.display = "block";
    }else{
        document.getElementById("modalHeader").innerHTML = "Duty Failed! The correct duty for today was: " + dutyToGuess.dutyName;
        //score chart
        generateStatChart();
        modal.style.display = "block";
    }
}

function displayGameOverScreen(){
    // create a score screen popup
}

function generateStatChart(){
    new Chart(resultsChart, {
        type: "bar",
        data: {
            labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            datasets: [{
                label: "# of Wins",
                data: [userScoresRecord[0], userScoresRecord[1],userScoresRecord[2], userScoresRecord[3], userScoresRecord[4],
                userScoresRecord[5], userScoresRecord[6], userScoresRecord[7], userScoresRecord[8], userScoresRecord[9], userScoresRecord[10]],
                borderWidth: 1,
                backgroundColor: '#1d6ff2',
                borderColor: '#001f52'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                },
                yAxes: [{
                    ticks: {
                        precision: 0
                    }
                }]
            }
        }
    })
}

// Close and Open Modal
// Get the button that opens the modal
var btn = document.getElementById("myBtn");
btn.onclick = function(){
    
}
span.onclick =  function(){
    modal.style.display = "none";
}
window.onclick = function(event){
    if(event.target == modal){
        modal.style.display = "none";
    }
}

function generateDutyOfTheDay(){
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
    return Math.floor(dutyNumber);
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
    /*https://www.w3schools.com/howto/howto_js_autocomplete.asp*/
    var currentFocus;

    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /* Close any open lists */
        closeAllLists();
        if(!val) return false;
        currentFocus = -1;
        /* Create a DIV element that contains values */
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /* Append DIV element to autocomplete container */
        this.parentNode.appendChild(a);
        let autocompleteCount = 0;
        for(let i = 0; i < arr.length; i++){
            let arrItem = arr[i];
            //disallow comparing to difficulty

            let doesInclude = arrItem.dutyName.toLowerCase().indexOf(val.toLowerCase());
            if(doesInclude >= 0){
                b = document.createElement("DIV");
                /* Make matching letter bold */
                b.innerHTML = arrItem.dutyName.substr(0, doesInclude);
                b.innerHTML += "<strong>" + arrItem.dutyName.substr(doesInclude, val.length) +  "</strong>";
                b.innerHTML += arrItem.dutyName.substr(doesInclude + val.length);

                console.log(b.innerHTML)
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
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if(e.keyCode == 40){
            //arroy key down pressed
            currentFocus++;
            addActive(x);
        }else if(e.keyCode == 38){
            //up arrow is pressed
            currentFocus--;
            addActive(x);
        }else if(e.keyCode == 13){
            //enter key is pressed
            //prevent form submission
            e.preventDefault();
            if(currentFocus > -1) {
                //simulate click on focused item
                if (x) x[currentFocus].click();
            }
        }
    })
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
        gameOver(true);
    }else{
        // remove a life for incorrect guess and check failstate
        lives--;
        updateLivesCount();
        if(lives <= 0) {
            gameOver(false);
        }
    }
    //reset input window
    input.value = "";
}