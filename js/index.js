//index.js
import { reactive } from "./util/reactive.js";
import { getRouterOptions } from "./util/util.js";
import { homePage } from "./home/home.js";
import { recommendListPage } from "./recommendList/recommendList.js";
import { playerPage } from "./player/player.js";
import { initPlayerControl, initPlayerEvent } from "./home/control.js";

//路由表
const routers = [
  {
    name: "home",
    desc: "首页",
    path: "/home",
    component: homePage,
  },
  {
    name: "recommendList",
    desc: "推荐列表",
    path: "/recommendList",
    component: recommendListPage,
  },
  {
    name: 'player',
    desc: "播放页面",
    path: '/player',
    component: playerPage
  },
];

//数据响应式执行函数
let effective = () => changeComponent();
// 数据响应式处理
export const hashProxy = reactive(
  {
    hash: "",
  },
  effective
);

// let hash;

function changeComponent() {
  let options = getRouterOptions(hashProxy.hash);
  const [{ component, name, desc }] = routers.filter(
    (router) => router.name == options.name
  );
  // if (options.name == "recommendList") {
  //   const link = document.createElement("link");
  //   link.rel = "stylesheet";
  //   link.type = "text/css";
  //   link.href = "../css/recommendList.css";
  //   document.getElementsByTagName("head")[0].appendChild(link);
  // }
  component(options);
  document.querySelector("#header-title").innerHTML = desc;
}

// 监听页面 load 和 hashchange 事件，事件触发后对代理对象赋值
window.addEventListener("load", () => {
  hashProxy.hash = window.location.hash;
  initControl();
  // changeComponent()
});

window.addEventListener("hashchange", () => {
  hashProxy.hash = window.location.hash;
  // changeComponent()
});


function initControl() {
  //初始化的时候加载歌曲
  initPlayerControl(false);
  //绑定底部控制栏的事件
  initPlayerEvent();
}