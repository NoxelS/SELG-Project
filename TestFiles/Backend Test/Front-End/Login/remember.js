function remember_onload(){
    if(localStorage.getItem('remember')){
        document.getElementById("username").value = JSON.parse(localStorage.getItem('remember')).username;
        document.getElementById("ckb1").checked = true;
    }
}


function remember_meClicked(){

    const remeberState = document.getElementById("ckb1").checked;

    // Wird aktiviert
    if(remeberState && !localStorage.getItem('remember')){
        localStorage.setItem('remember', JSON.stringify({
            active: true,
            username: "Noel",
        }));
    }

    // Wird deaktiviert
    if(!remeberState){
        localStorage.clear();
    }
    console.log(remeberState);

}