
function Maker(a) {
  this.a = a;
  this.print = function() {
    console.log(a);
  };
}


new Maker("hi").print();
