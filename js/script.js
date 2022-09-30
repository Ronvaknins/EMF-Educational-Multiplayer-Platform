
function makeMenu() {
  
  // Get the menuitems
  var menuItems = document.querySelectorAll("[role='menuitem']");
  
  // Loop through the menuItems and add an even listener
  for(i = 0; i < menuItems.length; i++) {
    menuItems[i].addEventListener('click', setCurrent);
  }

  // Set current status
  function setCurrent() {
    for(x = 0; x < menuItems.length; x++) {
      menuItems[x].setAttribute('data-selected', '');
    }
    this.setAttribute('data-selected', 'selected');
  }
}



var netsblox;
async function startGame(url_game,game_n){

    loader("ON");
    let group = await prompt("Select Group: ");
    if(group === "" || group === null){alert("נא לבחור קבוצה!");return;}
    console.log(group);
    // let cid = parent.scormplayerdata.courseid;
    // console.log(cid);
    let def_config = await httpGet(url,'getDefaultConfig','22087',game_n);
    let uname = "asd"
    let gstart = document.getElementById('game-start');
    document.getElementById('games').style.display = 'none';
    var full_url = url_game+"&setVariable=group%3D"+group+"&setVariable=config_name%3D"+def_config+"&embedMode";
    console.log(full_url);
    gstart.style.display = 'block';
    await gstart.insertAdjacentHTML('afterbegin',`
    <iframe id="netsblox"
    allowfullscreen= "allowfullscreen"  
    allow="geolocation; microphone; camera"
    src=`+full_url+` 
    frameboarder="0"
    style="width :100%; height:90%; ;position:absolute;">
    </iframe>
    `
    );
    const container = document.getElementById('netsblox');
    netsblox = await new EmbeddedNetsBloxAPI(container);
    console.log('Now, you can interact with netsblox using:', netsblox);
    console.log('Please open the project found in this directory to see an example project.');
    netsblox.addEventListener('setScore', event => {
      console.log(event.detail);
      scorm.set("cmi.score.raw",parseInt(event.detail, 10));
      scorm.save();
    });
    loader("OFF");
}
let scorm = pipwerks.SCORM;


async function httpGet(surl,p1,p2,p3) {
  var data = {'param1': p1, 'param2': p2,'param3': p3};
  var url = new URL(surl);
  for (let k in data) { url.searchParams.append(k, data[k]); }
  let req = await fetch(url);
  req = await req.json();
  return req;
}

var url = "https://script.google.com/macros/s/AKfycbyH1nxVtvqc_tmss5H5sIMEuGF2Eqh1toNLSkxZ2Eo6tcNH94EJ40ICZq5ihln68oWXxQ/exec";

async function pull_games(){
  loader("ON");
    let games = await httpGet(url,'getDataFromsheet','games-db');
    //console.log(games);
    var games_div = document.getElementById("games");
    var end_row = false;
    var innerhtml = "";
    games.forEach((element,index) => {
      if(index % 3 == 0)
      {
        if(end_row)
        {
          innerhtml += `</div>
          <div class="row">`;
        }
        else
        {
          innerhtml += '<div class="row">';
          end_row = true;
        }
      }
      innerhtml +=`
      <div class="col">
          <a class="tileLink" href="#" onclick="startGame('`+element.url+`','`+element.game_name+`')">
          <article class="tile">
              <figure>
                <img src=`+element.img_url+` />
              <figcaption>
                <h2>`+element.game_name+`</h2>
                `+element.description+`
              </figcaption>
            </figure>
          </article>
        </a>
      </div>
      `;
      
    });

    games_div.insertAdjacentHTML('beforeend',innerhtml);
    loader("OFF");

  }

window.onload = async () => {
    loader("ON");
    scorm.version = "2004";
    scorm.init();
    if(parent.document.getElementById('action-menu-toggle-3') != null)
    {
      document.getElementById('teacher_panel').style.display = "block";
    }
    await makeMenu();
    loader("OFF");

  };

async function mplayer(){
  loader("ON");
  document.getElementById('brand-logo').style.display = "none";
  document.getElementById('game-start').innerHTML = "";
  document.getElementById('game-start').style.display = "none";

  await pull_games();
  document.getElementById('games').style.display = 'block';

  loader("OFF");
}
function home(){
  loader("ON");
  document.getElementById('games').style.display = 'none';
  document.getElementById('games').innerHTML = "";
  document.getElementById('game-start').innerHTML = "";
  document.getElementById('game-start').style.display = "none";
  document.getElementById('brand-logo').style.display = "block";
  loader("OFF");
}

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
