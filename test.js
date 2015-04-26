function a(param1,param2,param3) {
  console.log(param1 + ", " + param2 + ", " + param3);
}

var c = a.bind(null,'hi','there');

c('julie’);