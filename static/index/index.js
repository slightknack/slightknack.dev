// Put your js here
var SCROLL_WINDOW = 0;
var SCROLL_PERCENT = 0;
let SPEED = 0.2;
let MOUNTAIN_OVERLAY = 0.4;
let MOUNTAIN_DROP = 0.156;
let CLOUD_OVERLAY = 0.7;
let CLOUD_DROP = 0.1;

function scroll_pos(event) {
  let scroll = Date.now() / 10;
  let visible = window.innerHeight;
  let full = document.body.offsetHeight;
  SCROLL_PERCENT = scroll / (full - visible);
  SCROLL_WINDOW = scroll / visible;
  display_scroll();
  display_scroll_2();
}

function display_scroll() {
  var counter = document.getElementById("counter");
  counter.textContent = SCROLL_WINDOW;

  var first = document.getElementById("mountain-1");
  var second = document.getElementById("mountain-2");

  let image_height = first.offsetHeight;
  let target_height = Math.min(
    window.innerHeight * MOUNTAIN_OVERLAY,
    image_height * MOUNTAIN_OVERLAY,
  );
  let height = image_height - target_height;

  first.style.right = ((SCROLL_WINDOW * SPEED) % 1) * window.innerWidth + "px";
  first.style.bottom =
    ((SCROLL_WINDOW * SPEED) % 1) * image_height * MOUNTAIN_DROP -
    height +
    "px";
  first.style.visibility = "visible";

  second.style.right =
    (((SCROLL_WINDOW * SPEED) % 1) - 1) * window.innerWidth + "px";
  second.style.bottom =
    (((SCROLL_WINDOW * SPEED) % 1) - 1) * image_height * MOUNTAIN_DROP -
    height +
    "px";
  second.style.visibility = "visible";
  window.requestAnimationFrame(scroll_pos);
}

function display_scroll_2() {
  var first = document.getElementById("cloud-1");
  var second = document.getElementById("cloud-2");

  let image_height = first.offsetHeight;
  let target_height = Math.min(
    window.innerHeight * CLOUD_OVERLAY,
    image_height * CLOUD_OVERLAY,
  );
  let height = image_height - target_height;

  first.style.right =
    ((SCROLL_WINDOW * SPEED * 0.5) % 1) * window.innerWidth + "px";
  first.style.bottom =
    ((SCROLL_WINDOW * SPEED * 0.5) % 1) * image_height * CLOUD_DROP -
    height +
    "px";
  first.style.visibility = "visible";

  second.style.right =
    (((SCROLL_WINDOW * SPEED * 0.5) % 1) - 1) * window.innerWidth + "px";
  second.style.bottom =
    (((SCROLL_WINDOW * SPEED * 0.5) % 1) - 1) * image_height * CLOUD_DROP -
    height +
    "px";
  second.style.visibility = "visible";
}

window.addEventListener("load", scroll_pos);
window.addEventListener("scroll", scroll_pos);
window.addEventListener("resize", scroll_pos);
