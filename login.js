const puppeteer = require("puppeteer");
const id = "misid46226@isecv.com";
const pw = "123456789";
let tab;
let idx;
let gCode;

// puppeteer has promisfied functions

// by default headless = true

let browserOpenPromise = puppeteer.launch({   // gives a browser instance 
  headless: false,         // browser open hota dhikhega
  defaultViewport: null,   // jo browser ka default viewport(800*600) set hota h wo hat jaayea
  args: ["--start-maximized"], // window maximize ho jaayegi
});

browserOpenPromise
  .then(function (browser) {
    console.log("browser is opened !");
    return browser.pages();  // gives array of tabs/pages and returned them
  })
  .then(function (pages) {
    tab = pages[0]; // us pages arr me se 1st page nikal liya
    return tab.goto("https://www.hackerrank.com/auth/login");  //goto the link given
  })
  .then(function () {
    return tab.type("#input-1", id);  // type a value(id in this case) in the given selector element // id box
  })
  .then(function () {
    return tab.type("#input-2", pw);  // password box
  })
  .then(function () {
    return tab.click(".ui-btn.ui-btn-large.ui-btn-primary.auth-button.ui-btn-styled"); //click on the given selector element  // login button
  })
  .then(function () {
    return waitAndClick("#base-card-1-link"); // this is a promisified fxn (Check Lect 11 Notes for `how to create own promise`)
  })
  .then(function () {
    return waitAndClick('a[data-attr1="warmup"]');
  })
  .then(function () {
    return tab.waitForSelector(".js-track-click.challenge-list-item", {
      visible: true,
    });
  })
  .then(function () {
    // tab.$() // document.querySelector;  // it will run document.querySelector in the browser and gives you only first matching elements
    return tab.$$(".js-track-click.challenge-list-item"); // it will run document.querySelectorAll in the browser and gives you array of all the elements
  })
  .then(function (allQuesArray) { // jo array piche se mila hai idhar pass hota hai
    // [<a /> , <a /> , <a /> , <a />]; // array me saare questions pde hai in the form of a tags.
    let allPendingPromises = [];
    for (let i = 0; i < allQuesArray.length; i++) {
      let oneATag = allQuesArray[i];   // ek a tag nikalte hai 
      let pendingPromise = tab.evaluate(function (element) { return element.getAttribute("href");}  , oneATag); // aur usme se href nikal lete hai
      // evaluate isme passed fxn ko jaake dom me chla deta hai 
      // us fxn me element(oneTag in this case) pass hota hai jo evaluate me as 2nd argument diya jaata hai  
      // ab kyunki hume yha pe href chahiye hai 
      // isiliye humne getAttribute lga ke jo attribute(href in this case) chahiye hota hai utha liya
      // evaluate hume ek ek karke pending promises dega jise hum hmare allPendingPromises me push karte jaayenge
      allPendingPromises.push(pendingPromise);
    }
    // [ Promise<Pending> , Promise<Pending> , Promise<Pending> , Promise<Pending> ];
    let allPromisesCombined = Promise.all(allPendingPromises); 
    // Promise.all gives a single pending promise in exchange of multiple pending promises
    // aur jaise hi un sb pending promises ki state change ho jaati hai to iski bhi state change ho jaati hai
    // aur ye un sb promises se milne wale data ko ek array me daalke de deta hai
    // indirectly Promise.all ne sb pending promises pe ek then ki call lga di hai
    return allPromisesCombined; // to yha se saare questions ke links/hrefs ka array next wale scb me jaayega
  })
  .then(function(allQuesLinks){
    let oneQuesSolvePromise = solveQuestion(allQuesLinks[0]);
    for(let i=1 ; i<allQuesLinks.length ; i++){   // to understand this refer Notes -> Lect 12 -> n files Promises Serial : asyncSerial.js
      oneQuesSolvePromise = oneQuesSolvePromise.then(function(){
        let nextQuesSolvePromise = solveQuestion(allQuesLinks[i]);
        return nextQuesSolvePromise;
      })
    }
    return oneQuesSolvePromise;
  })
  .then(function(){
    console.log("All Ques Solved Succesfully !!!!");
  })
  .catch(function(err){
    console.log(err);
  });

  function getCode(){
    return new Promise(function(scb , fcb){
      let waitPromise = tab.waitForSelector(".hackdown-content h3" , {visible:true});
      waitPromise.then(function(){
        return tab.$$(".hackdown-content h3");
      })
      .then(function(allCodeNamesElement){
        // [<h3>C++</h3> , <h3>Python</h3> , <h3>Java</h3> ]
        let allCodeNamesPromise = [];

        for(let i=0 ; i<allCodeNamesElement.length ; i++){
          let codeNamePromise = tab.evaluate( function(elem){  return elem.textContent;   }  , allCodeNamesElement[i]  );
          allCodeNamesPromise.push(codeNamePromise);
        }
        // allCodeNamesPromise = [Promise<data> , Promise<data> , Promise<data> ];
        let combinedPromise = Promise.all( allCodeNamesPromise );
        // Promise<Pending> => Promise< [data,data,data] >
        return combinedPromise;
      })
      .then(function(allCodeNames){
        // [C++ , Python , Java];
        for(let i= 0 ;i<allCodeNames.length ; i++){
          if(allCodeNames[i] == "C++"){
            idx = i;
            break;
          }
        }
        return tab.$$(".hackdown-content .highlight"); // document.querySelectorAll
      })
      .then(function(allCodeDiv){
        // [<div></div> , <div></div> , <div></div>];
        let codeDiv = allCodeDiv[idx];
        return tab.evaluate(function(elem){ return elem.textContent;   }  , codeDiv);
      })
      .then(function(code){
        gCode = code;
        scb();
      })
      .catch(function(error){
        fcb(error);
      })
    })
  }
  
  function pasteCode(){
    return new Promise(function(scb , fcb){ //scb = next then ka callback fxn && fcb = bdi wali chain ka catch ka callback fxn
      let waitAndClickPromise = waitAndClick('.checkbox-input');
      waitAndClickPromise.then(function(){
        return tab.waitForTimeout(2000); // isse wait hota hai jitna no. pass kiya h utna milli second ke liye
      })
      .then(function(){
        return tab.type('.custominput' , gCode); // [#3] why we type in custom input rather than typing in direct editor
      })
      .then(function(){
        return tab.keyboard.down("Control");
      })
      .then(function(){
        return tab.keyboard.press("A");
      })
      .then(function(){
        return tab.keyboard.press("X");  // cut
      })
      .then(function(){
        return tab.click('.monaco-scrollable-element.editor-scrollable.vs'); // click on editor
      })
      .then(function(){
        return tab.keyboard.press("A"); // sidha paste nhi kiya taki agr pahle se kuch likha ho wo select ho jaaye 
      })
      .then(function(){
        return tab.keyboard.press("V");  // aur fir selected text ki jagah hmara code paste krde paste
      })
      .then(function(){
        return tab.keyboard.up("Control");
      })
      .then(function(){
        scb();
      })
    })
  }

  function handleLockBtn(){
    return new Promise(function(scb , fcb){
      let waitForLockBtn = tab.waitForSelector('.ui-btn.ui-btn-normal.ui-btn-primary.ui-btn-styled' , {visible:true , timeout:5000});  // timeout : agr 5s me selector nhi mila to ye catch ko call lga dega 
      waitForLockBtn.then(function(){
        return tab.$('.ui-btn.ui-btn-normal.ui-btn-primary.ui-btn-styled');
      })
      .then(function(lockButton){
        return tab.evaluate(function(elem){ return elem.click()  } , lockButton); // simple click didn't work isiliye ye jugaad lga ke click krwaya
      })
      .then(function(){
        // Lock Button Found !!
        console.log("Lock Button Found !!");
        scb();
      })
      .catch(function(){ 
        // Lock Button Not Found !!
        console.log("Lock Button not found !!");
        scb();  // agr lock button nhi mila to bhi scb ko call lgegi kyunki maybe lock button manually hta ho ya fir pahle se na ho
      })
    })
  }

  // Humne kaise solveQuestion ko ek promisified fxn bnaya iske liye waitAndClick fxn ki explaination dekhlo 
  function solveQuestion(quesLink){  // iske pass ek ek karke sabhi questions ke link aayenge
    return new Promise( function(scb , fcb){
      let gotoPromise = tab.goto("https://www.hackerrank.com"+quesLink);
      gotoPromise.then(function(){
       return waitAndClick('div[data-attr2="Editorial"]'); // editorial page
      })
      .then(function(){
        return handleLockBtn();
      })
      .then(function(){
        return getCode();
      })
      .then(function(){
        return tab.click('div[data-attr2="Problem"]');  // problem page
      })
      .then(function(){
        return pasteCode();
      })
      .then(function(){
        return tab.click('.ui-btn.ui-btn-normal.ui-btn-primary'); // submit button
      })
      .then(function(){
        scb();
      })
      .catch(function(error){
        fcb(error);
      })
    });
  }
 
 function waitAndClick(selector) { // [#2]
  return new Promise(function (scb, fcb) { //[#1]
    let waitPromise = tab.waitForSelector(selector, { visible: true }); // jo selector pass kiya hai uske liye wait hoga.{visible : true} means jab tak wo visible nhi ho jaata
    waitPromise
      .then(function () {
        return tab.click(selector);
      })
      .then(function () {
        scb();
      })
      .catch(function () {
        fcb();
      });
  });
 }

 /*
 #1. scb = next wale then ka function yani next wale then ka scb
     fcb = badi wali chain ke catch ka fxn yani badi wali chain ke catch ka fcb


 #2.
 jab bhi kisi ek tab se dusre tab me navigation hota hai ya fir ek hi tab me ek page se dusre page me navigation hota hai
 to agle wale page pe jab tak hum wo selector mil nhi jaata tab tak hume wait krna pdega kyunki navigation aur load hone me kuch time lgta hai
 waitAndClick ek normal fxn tha aur usko hume ek promise me bdla hai (Check Lect 11 Notes for `how to create own promise`)
 taki next wale then ka scb previous wale(jisme ye fxn likh rkha hai) then ke scb pe dependent ho jaaye 
 
 waitAndClick function explaination : 
 1. Iss fxn ko ek selector milta hai
 2. Hum promise ka ek object create krte hai jisme ek fxn pass kiya hai jise promise obj call lgayega 
    jab use scb ya fcb mil jaayenge
 3. puppeteer ke fxn waitForSelector ko call lgayi jaati hai jo ek promise deta hai
    aur us promise par humne aage then aur catch ki calls lga rkhi hai
 4. jaise hi waitForSelector ko selector visible hoga waitPromise ki state change hogi 
    aur uspe lge then ka scb chlega means selector par click hoga
    aur agr selector par click ho gya to scb yani jaha pe waitAndClick fxn likh rkha hai uske next wale then ke scb ko call lg jaayegi
    lekin agr koi then fail ho jaata hai to fcb yani badi wali chain ke catck ke fxn ko call lg jaayegi

 */

  /*
  #3. Jo code hume mila hai wo humne ek variable me store krwaya hai 
      wo kahi pe copy nhi ho rkha 
      aur agr hum us code ko sidha monacco editor pe type krenge to hmare pass extra closing brackets('}') aa jaayenge
      kyunki monacco editor me opening bracket ke liye closing bracket apne aap aa jaata hai 
      isiliye hume iss code ko kahi aur type krna hoga aur fir waha se cut krke editor me paste krna hoga
      isiliye hum code ko custom input me type krte hai pahle aur fir custom input se cut krke editor me paste kr dete hai

  */