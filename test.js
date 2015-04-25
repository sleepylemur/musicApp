function a (p) {
  return "!"+p+"!";
}

function randomish() {
  var somevar = "lovely";
  return (function (temp) {return function(b) {console.log(a(somevar + " " +b+" "+temp));};})("yo");
}


var f = randomish();
f('hi');