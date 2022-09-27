

//global variables
var data = new Map();
var qids,questions,answers,qtype,qlevel,correct_answers,qweight,qpath,qpath,qskill,qresused,allquestions,configurations,fdbk_qadb;
var games_list;
var Addqconfig_btn;
var modal_addqconfig;

//db url - google-sheet
var url = "https://script.google.com/macros/s/AKfycbzBqXy9G1FOEJ57uo8XZXM89WPvmY3GajaWNOH3IifV7AC95-EXkmSo1ObW4YINsWqg/exec";



//init - loading games and autocomplete's - run window load.
(async () => {

  loader('ON');
  await loadGames();//load games from db
  configurations = await httpGet(url,"getConfigsName");//get all configs name's return: array
  // // start auto completes
  autocomplete(document.getElementById("load-config-input"), configurations);
  loader('OFF');

})()

// *** helpers functions: ***

//sending HTTP REQUESET
async function httpGet(surl,p1,p2,p3) {
  var data = {'param1': p1, 'param2': p2,'param3': p3};
  var url = new URL(surl);
  for (let k in data) { url.searchParams.append(k, data[k]); }
  let req = await fetch(url);
  req = await req.json();
  return req;
}

//Autocomplete
function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a,
      b,
      i,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) {
      return false;
    }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (i = 0; i < arr.length; i++) {
      /*check if the item starts with the same letters as the text field value:*/
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
        b.innerHTML += arr[i].substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function (e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].value;
          /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  })
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) {
      //up
      /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

//loading the selected config
async function loadSelectedConfig() {
  loader('ON');
  let qheb = "שאלה"+" "+1;
  document.getElementById("question-number").innerHTML = qheb;
  var config = document.getElementById("load-config-input").value;
  if(!configurations.includes(config))
  {
    alert("הקונפגרציה שנבחרה לא קיימת במאגר!");
    document.getElementById("load-config-input").value = "";
    loader('OFF');
    return;
  }
  fdbk_qadb = [] //feedback array
  qids = [];//current config qids array
  questions = [];//questions
  answers = [];//answers
  qtype = [];//questions type
  qlevel = [] // questions level
  correct_answers = [];
  qweight = []//questions weight
  qpath = []//questions path's
  qskill = []//questions skills
  qresused = []//questions reuse

  // get all data of the configuration tab in the database and parse it.
  const game_data = await httpGet(url,"getDataFromsheet",config);//get all sheet data (excluding the header) return: map containting the raws fromt the selected sheet
  console.log(game_data);
  const qa_data = await httpGet(url,"getDataFromsheet","qa-db");//get all sheet data (excluding the header) return: map containting the raws fromt the selected sheet
  var k=0
  for (let i = 0; i < game_data.length; i++) {
      qids.push(game_data[i].qid);
      qlevel.push(game_data[i].level);
      qweight.push(game_data[i].weight);
      qresused.push(game_data[i].reused);
      qpath.push(game_data[i].path);
      qskill.push(game_data[i].skill);
      answers.push([]); 
      fdbk_qadb.push([]); 
      correct_answers.push([]); 
      for(let j=0;j < qa_data.length;j++){        
          if(game_data[i].qid == qa_data[j].qid)
          {
              if(qa_data[j].question !== "" && qa_data[j].question !== questions[k] ){
                  k++;
                  questions.push(qa_data[j].question);
                  qtype.push(qa_data[j].type);
              }
              answers[i].push(qa_data[j].answer); 
              fdbk_qadb[i].push(qa_data[j].feedback); 
              correct_answers[i].push(qa_data[j].correct);
          }
          }
      }
  // first create array of QuestionConfig, then array of Question and finally the Configuration.
  await fillQuestionForm(0);
  await autocomplete(document.getElementById("search-question"), questions); 
  //currentConfig = new Configuration(questions);
  document.getElementById("question-form").style.display = "block";
  loader('OFF');
}

//fill question form in the main page - get: question index
function fillQuestionForm(index){
  answers[index].forEach((ans,i) =>{
    var qnum = "answer-"+(i+1);
    document.getElementById(qnum).value = ans;
    document.getElementById(qnum+"-checkbox").checked = correct_answers[index][i] ? true : false;
  })
  document.querySelectorAll('#q-fdbk').forEach((f,i) =>{
    f.value = fdbk_qadb[index][i];
  })
  document.getElementById("question-id").value = qids[index];
  document.getElementById("current-question").value = questions[index];
  document.getElementById('question-type').value = qtype[index];
  document.getElementById('current-level').value = qlevel[index];
  document.getElementById('current-weight').value = qweight[index];
  document.getElementById('current-skill').value = qskill[index];
  document.getElementById('current-skill-path').value = qpath[index];
  document.getElementById('current-skill-path').value = qpath[index];
  document.getElementById("checkbox-reuse").checked = qresused[index] ? true : false;
  // document.getElementById("question-type").value = fdbk[index];
}

//toggle bettwen questions from the seleceted config
function togglelQuestions(arrow)
{
  if(document.getElementById("load-config-input").value == ""){
    alert("אנא בחר קונפגרציה");
    return;
  }
  var index = qids.indexOf(parseInt(document.getElementById("question-id").value));
  if(arrow === 'left')
  {
    index--;
    if(index > qids.length-1){index = 0;}
    else if(index < 0){index = qids.length-1;}
    
  }
  else if(arrow === 'right')
  {
    index++;
    if(index > qids.length-1){index = 0;}
    else if(index < 0){index = qids.length-1;}
  }
  fillQuestionForm(index);
  let qheb = "שאלה"+" "+(index+1);
  document.getElementById("question-number").innerHTML = qheb;
  
}

//getting the games list fromt the game-db sheet
async function loadGames()
{
  let games = await httpGet(url,"getDataFromsheet","games-db");//get all sheet data (excluding the header) return: map containting the raws fromt the selected sheet
  games_list = [];
  games.forEach((game) => {
    games_list.push(game.game_name);
    data.set(game.game_name,game.url);
  });
  autocomplete(document.getElementById("load-game-input"), games_list);
}


//loading all questions from the qa-db sheet
async function getAllquestionsDB()
{
  loader('ON');
  const qa_data = await httpGet(url,"getDataFromsheet","qa-db");//get all sheet data (excluding the header) return: map containting the raws fromt the selected sheet
  qa_data.forEach((val) =>{
    if(val.question != ''){
      document.querySelector('tbody').insertAdjacentHTML("beforeend",`
        <tr>
          <td>`+val.question+`</td>
          <td>`+val.qid+`</td>
          <td>`+val.type+`</td>
          <td>
          <button type="button" class="btn btn-default btn-sm" id="addqconfig" value="`+val.qid+`" title="הוסף לקונפגרציה הנוכחית">
          <span class="glyphicon glyphicon-plus"></span></button>
          </td>
          <td><button type="button" class="btn btn-danger" id="delete-question-db-modal" value="`+val.qid+`">מחק</button>&ensp;</td>
        </tr>`);
    }   
  })

  Addqconfig_btns = await document.querySelectorAll("#addqconfig");
  modal_addqconfig = await document.getElementById("addq-form");
  await Addqconfig_btns.forEach((b) =>{
    b.onclick= async function(e) {
      loader('ON');
      let curr_config = await document.getElementById("load-config-input").value;
      if(curr_config == ""){
        alert("אנא בחר קונפגרציה");
        modal.style.display = "none";
        loader('OFF');
        return;
      }
      document.getElementById("addq_modal-qid").value = await e.srcElement.value;
      modal_addqconfig.style.display = "block";
      loader('OFF');
    }

  })
  await document.querySelectorAll('#delete-question-db-modal').forEach((b) =>{
    b.onclick = async function(e)
    {
      document.getElementById('rmq-appr').value = await b.value;
      document.getElementById('delq-form').style.display = "block";
      loader('OFF');
    }
    
  })
  loader('OFF');
}
//loader animation
function loader(state)
{
  if(state === 'ON'){
    document.getElementById('loader').style.visibility = 'visible';
    document.getElementById('main').style.filter="blur(3px)";
  }
  else if(state === "OFF")
  {
    document.getElementById('loader').style.visibility = 'hidden';
    document.getElementById('main').style.filter="blur(0px)";
  }
}


// **** buttons onclick function: ****

//close new game modal and reset all fields
function closeNewGame() {
  document.getElementById("new-game-name").value = "";
  document.getElementById("new-game-url").value = "";
  document.getElementById("new-game-description").value = "";
  document.getElementById("new-game-img").value = "";
  document.getElementById("addnew-game").style.display = "none";
}

//save new game - send all fields data to the games-db sheet
async function saveNewGame() {
  loader('ON');
  let queryString_newGame = [];
  queryString_newGame.push(document.getElementById("new-game-name").value)
  queryString_newGame.push(document.getElementById("new-game-url").value);
  queryString_newGame.push(document.getElementById("new-game-description").value);
  queryString_newGame.push(document.getElementById("new-game-img").value)
  //add row to games list sheet in database
  
  let add_Game = await httpGet(url,"addGame",queryString_newGame.toString());//"gamename,url,description,image,config"
  await loadGames();
  closeNewGame();
  loader('OFF');
}


// qa-db questions modal handle:
// When the user clicks on the button, open the modal
document.getElementById("list-question-db").onclick = function() {
  document.getElementById("list-q").style.display = "block";
  getAllquestionsDB();
}
// When the user clicks on <span> (x), close the modal
document.getElementById("close-btn").onclick = function() {
  document.getElementById("list-q").style.display = "none";
  document.querySelector('tbody').innerHTML = "";
}

//wirte the changes to all db - add it to the current config and qa-db sheet
document.getElementById('save-question-conf').onclick = async function(e) {
  loader('ON');
  var questionNumber = document.getElementById("question-number").value;
  var current_config = document.getElementById("load-config-input").value;
  var questionId = document.getElementById("question-id").value;
  var currentQuestion = document.getElementById("current-question").value;
  var questionType = document.getElementById("question-type").value;
  var fdbk = [];
  document.getElementById("question-form").querySelectorAll("#q-fdbk").forEach((fdbk_input)=>{
    fdbk.push(fdbk_input.value);
  })

  var correctAnswersIndexs = [];
  var answersComma = []
  for(i=1;i<=4;i++){
    var ans = "answer-"+i;
    var chk = ans+'-checkbox';
    answersComma.push(document.getElementById(ans).value);
    if(document.getElementById(chk).checked){
      correctAnswersIndexs.push(i-1);
    }
  }
  if(correctAnswersIndexs.length === 0){alert("נא לסמן לפחות תשובה אחת נכונה");loader('OFF');return;}
  var currentLevel = document.getElementById("current-level").value;
  var currentWeight = document.getElementById("current-weight").value;
  var checkboxReuse = document.getElementById("checkbox-reuse").checked ? true : false;
  var currentSkillPath = document.getElementById("current-skill-path").value;
  var currentSkill = document.getElementById("current-skill").value;
  var queryString = ``+
  questionId+`;`
  +currentLevel+`,`
  +questionNumber+`,`
  +currentWeight+','
  +checkboxReuse+','
  +currentSkillPath+','
  +currentSkill+';'
  +currentQuestion+';'
  +answersComma.toString()+';'
  +correctAnswersIndexs.toString()+';'
  +questionType+';'
  +fdbk.toString();
  let saveAll = await httpGet(url,"saveAll",current_config,queryString);//save all 
  await loadSelectedConfig();
  loader('OFF');

}



document.getElementById("addq-cancel").onclick = async function(e){
  modal_addqconfig.style.display = "none";
  //reset the addq-form modal inputs
  await document.getElementById("addq-inputs").querySelectorAll("input").forEach((input) => {
    input.value = "";
  })
  document.getElementById("addq-checkbox-reuse").checked = false;
}

//add the selected question to the current config
document.getElementById("addq-add").onclick = async function(e){
  loader("ON");
  var queryString_addqconf = [];
  //reset the addq-form modal inputs
  await document.getElementById("addq-inputs").querySelectorAll("input").forEach((input) => {
    
    if(input.type == 'checkbox'){
      input.checked == true ? queryString_addqconf.push("TRUE"):queryString_addqconf.push("FALSE")
    }
    else{
      queryString_addqconf.push(input.value);
      input.value = "";
    }
    
  })
  document.getElementById("addq-checkbox-reuse").checked = false;
  console.log(queryString_addqconf.toString());
  //adding question from qa db to current config
  let add_qcon = await httpGet(url,"addQuestion_config",document.getElementById("load-config-input").value,queryString_addqconf.toString());//add question to a config from DB gets:configname,array
  console.log(add_qcon);
  modal_addqconfig.style.display = "none";
  await loadSelectedConfig();
  loader("OFF");
}

//add new question button
document.getElementById("new-question").onclick = async function(e){
    document.getElementById("addnewq").style.display = 'block';

}
//add new question cancel button
document.getElementById("addnewq-cancel").onclick = function(e)
{
  document.getElementById("addnewq").style.display = 'none';
}
//if checked will add option to add new question form to add the new question also to current config
document.getElementById("checkbox-addnewq-currconf").onclick = async function(e){
  let curr_config = await document.getElementById("load-config-input").value;
  if(curr_config == ""){
    alert("אנא בחר קונפגרציה");
    document.getElementById("addnewq").style.display = 'none';
    e.srcElement.checked = false;
    return;
  }
  e.srcElement.checked ? document.getElementById("addnewq-config").style.display = "block":document.getElementById("addnewq-config").style.display = "none";
}
//saving the new question to the qa-db and also to current config db sheet if save to current config is checked
document.getElementById("addnewq-add").onclick = async function(e){
  loader("ON");
  let addnewqDBanswers = [];
  let addnewqDBcorrect = [];
  let addnewqDBfdbk = [];
  let new_question = document.getElementById("addnewq-question").value;
  await document.getElementById("addnewqDB-answers").querySelectorAll('input[type="checkbox"]').forEach((input) => { 
    addnewqDBcorrect.push(input.checked);
  })
  if(addnewqDBcorrect.every(element => element === false)){alert("נא לסמן לפחות תשובה אחת נכונה");loader("OFF");return;}
  await document.getElementById("addnewqDB-answers").querySelectorAll("input").forEach((input) => { 
    if(input.type == "checkbox"){
      input.checked = false;
    }
    else if(input.id == "newq-fdbk")
    {
      addnewqDBfdbk.push(input.value);
      input.value = "";
    }
    else
    {
      addnewqDBanswers.push(input.value);   
      input.value = "";
    }
  })

  let question_type = document.getElementById("addnewq-type").value;
  let queryString_addnewqDB = new_question+`;`
  +addnewqDBanswers.toString()+`;`
  +addnewqDBcorrect.toString()+`;`
  +question_type+`;`
  +addnewqDBfdbk.toString();
  var newq_qid = await httpGet(url,"addQuestion_qaDB",queryString_addnewqDB);//array converted to string seprated with comma

  if(document.getElementById("checkbox-addnewq-currconf").checked)
  {
    var queryString_addnewqconf = [];
    queryString_addnewqconf.push(newq_qid);
    await document.getElementById("addnewq-config").querySelectorAll("input").forEach((input) => {
      
      if(input.type == 'checkbox'){
        input.checked == true ? queryString_addnewqconf.push("TRUE"):queryString_addnewqconf.push("FALSE")
      }
      else{
        queryString_addnewqconf.push(input.value);
        input.value = "";
      }
      
    })
    document.getElementById("addnewq-checkbox-reuse").checked = false;
  
   
    //adding question from qa db to current config
    let add_qcon = await httpGet(url,"addQuestion_config",document.getElementById("load-config-input").value,queryString_addnewqconf.toString());//add question to a config from DB gets:configname,array
    await loadSelectedConfig();
  }
  document.getElementById("addnewq").style.display = 'none';
  loader("OFF");
}

//delete question approval from qlist modal
document.getElementById('rmq-appr').onclick = async function(e){
  loader("ON");
  let qid_mo = await e.srcElement.value;
  let delete_fromdb = await httpGet(url,"deleteFromDB",qid_mo);//delete from entrie DB 
  document.getElementById('delq-form').style.display = "none";
  document.querySelector('tbody').innerHTML = "";
  await getAllquestionsDB();
  loader("OFF");
}
//delete question qlist modal cancel button
document.getElementById('rmq-cancel').onclick = async function(e)
{
  document.getElementById('delq-form').style.display = "none";
}

//delete question approval modal from outside (the main page)
//delete current question from qa-db and all configs contained this question.
document.getElementById('rmq-outside-appr').onclick = async function(e){
  loader("ON");
  let qid_outmo = await document.getElementById('question-id').value;
  let delete_fromdb = await httpGet(url,"deleteFromDB",qid_outmo);//delete from entrie DB 
  document.getElementById('delq-outside-form').style.display = "none";
  await loadSelectedConfig();
  loader("OFF");
}
//delete question modal from outside(main page) cancel button
document.getElementById('rmq-outside-cancel').onclick = async function(e)
{
  document.getElementById('delq-outside-form').style.display = "none";
}
//open modal to approve the current question delete from entrie db
document.getElementById('delete-question-db').onclick = async function() {
  let configfile = await document.getElementById('question-id').value
  if(configfile === "")
  {
    alert("נא לטעון קובץ קונפגרציה!");
    return;
  }
  document.getElementById('delq-outside-form').style.display = "block";

}

//loading the selected game - will show the game inside the iframe box
document.getElementById('load-game-btn').onclick = function(e){
  loader('ON');
  var game = document.getElementById("load-game-input");
  if(!games_list.includes(game.value))
  {
    alert("המשחק שנבחר לא קיים במאגר");
    game.value = "";
    loader('OFF');
    return;
  }
  var iframe = document.getElementById("game-iframe");
  // iframe.src = data.get(game.value);
  iframe.src = data.get(game.value);
  loader('OFF');
}

//show question form in the main page - by clicking the down arrow
function toggleQuestionForm() {
  let element = document.getElementById("question-form");
  if (element.style.display == "none" || !element.style.display) {
    element.style.display = "block";
  } else {
    element.style.display = "none";
  }
}

//save new config button onclick
document.getElementById('open-new-config-btn').onclick = function(e){
  document.getElementById("new-config-name").value = "";
  document.getElementById("addnew-config").style.display = "block";
}
//cancel new config creation
document.getElementById('revert-new-config').onclick = function(e){
  document.getElementById("addnew-config").style.display = "none";
}

//save new config button onclick
document.getElementById('save-new-config').onclick = async function(e){
  loader('ON');
  let name = document.getElementById("new-config-name").value;
  if(name === "")
  {
    alert("שם קונפגרציה לא יכול להיות ריק");
    loader('OFF');
    return;
  }
  configurations = await httpGet(url,"getConfigsName");//get all configs name's return: array
  if(configurations.includes(name))
  {
    alert("שם קונפגרציה קיים במאגר, אנא בחר שם אחר");
    document.getElementById("addnew-config").style.display = "none";
    loader('OFF');
    return;
  }
  // create new sheet in database for configuration
  let add_conf = await httpGet(url,"addConfig",name);//add a new config
  configurations = await httpGet(url,"getConfigsName");
  autocomplete(document.getElementById("load-config-input"), configurations);
  document.getElementById("addnew-config").style.display = "none";
  loader('OFF');
}

//show new game creating modal
document.getElementById('new-game-btn').onclick = function(e){
  document.getElementById("addnew-game").style.display = "block";
}

//delete current question from the current selected config
document.getElementById('delete-question-conf').onclick = async function(e)
{
  loader("ON");
  let q_delete = document.getElementById("question-id").value;
  let currConf = document.getElementById("load-config-input").value;
  let delete_fromcf = await httpGet(url,"deleteFromConfig",currConf,q_delete);//delete from config configname,qid to remove
  loadSelectedConfig();
}

//empty all fields of question form
document.getElementById('revert-question').onclick = function(e){
  document.getElementById("question-number").value = "";
  document.getElementById("question-id").value = "";
  document.getElementById("current-question").value = "";
  document.getElementById("question-type").value = "";
  // document.getElementById("question-feedback").value = "";
  document.getElementById("answer-1-checkbox").checked = false;
  document.getElementById("answer-2-checkbox").checked = false;
  document.getElementById("answer-3-checkbox").checked = false;
  document.getElementById("answer-4-checkbox").checked = false;
  document.getElementById("answer-1").value = "";
  document.getElementById("answer-2").value = "";
  document.getElementById("answer-3").value = "";
  document.getElementById("answer-4").value = "";
  document.getElementById("current-level").value = "";
  document.getElementById("current-weight").value = "";
  document.getElementById("checkbox-reuse").checked = false;
  document.getElementById("current-skill-path").value = "";
  document.getElementById("current-skill").value = "";
  document.getElementById("load-config-input").value = "";
  toggleQuestionForm();

}