import { getAudioSrc, getAudioInfo } from "../service/ajax.js";
import { formatSongTime } from "../util/util.js";
import { changePlayerMusicId } from "../player/player.js";
import { reactive } from "../util/reactive.js";

//用来控制播放、暂停
const isPlayProxy = reactive(
  {
    isPlay: false,
  },
  playPauseKeyRender
);

const musicIdProxy = reactive(
  {
    musicId: 355992,
  },
  initPlayerControl
);
const musicModeProxy = reactive(
  {
    musicMode: 0,
  },
  musicModeRender
);

function playPauseKeyRender() {
  const myAudio = document.querySelector("#myAudio");
  const playerControl = document.querySelector(
    ".player-control-unit #player-control"
  );
  //控制音乐的播放和暂停
  isPlayProxy.isPlay ? myAudio.play() : myAudio.pause();
  //控制播放和暂停的图标
  isPlayProxy.isPlay
    ? (playerControl.innerHTML = `<use xlink:href="#icon-bofangzhong"></use>`)
    : (playerControl.innerHTML = `<use xlink:href="#icon-zanting"></use>`);
}

function musicModeRender() {
  const mode = window.localStorage.getItem("musicMode") || 0;
  const musicModeStr =
    mode == 0
      ? '<use xlink:href="#icon-liebiaoxunhuan"></use>'
      : mode == 1
        ? '<use xlink:href="#icon-suijibofang"></use>'
        : '<use xlink:href="#icon-danquxunhuan"></use>';
  document.querySelector("#musicMode").innerHTML = musicModeStr;
}

export function initPlayerEvent() {
  // 事件的初始化放在首次加载 index.js 时执行，控制播放及暂停
  const playerControl = document.querySelector(
    ".player-control-unit #player-control"
  );
  playerControl.addEventListener("click", () => {
    isPlayProxy.isPlay = !isPlayProxy.isPlay;
  });
  let isPlayerListShow = false;
  //控制播放列表显示与隐藏
  document.querySelector("#playerList").addEventListener("click", () => {
    const listsEle = document.querySelector(".player-list");
    isPlayerListShow = !isPlayerListShow;
    listsEle.classList.remove("display-none");
    isPlayerListShow && listsEle.classList.add("display-none");
  });
  //点击图标改变播放模式
  document.querySelector("#musicMode").addEventListener("click", (e) => {
    let musicMode = window.localStorage.getItem("musicMode") || 0;
    musicMode = ++musicMode % 3;
    musicModeProxy.musicMode = musicMode;
    window.localStorage.setItem("musicMode", musicMode);
  });
  const myAudio = document.querySelector("#myAudio");
  //上一首
  document.querySelector("#player-prev").addEventListener("click", () => {
    musicIdProxy.musicId = changeMusicId("prev");
    changePlayerMusicId(musicIdProxy.musicId);
  });
  //下一首
  document.querySelector("#player-next").addEventListener("click", () => {
    musicIdProxy.musicId = changeMusicId("next");
    changePlayerMusicId(musicIdProxy.musicId);
  });
  //歌曲播放自动切歌
  myAudio.addEventListener("ended", () => {
    isPlayProxy.isPlay = false;
    musicIdProxy.musicId = changeMusicId("next");
    changePlayerMusicId(musicIdProxy.musicId);
  });
  // 点击播放列表修改
  document.querySelector(".player-list-ul").addEventListener(
    "click",
    (e) => {
      if (e.target.parentNode.tagName != "LI") return;
      const musicId = e.target.parentNode.getAttribute("data-id");
      window.localStorage.setItem("musicId", musicId);
      musicIdProxy.musicId = musicId;
      changePlayerMusicId(musicIdProxy.musicId);
    },
    true
  );
  // 播放进度更新实时更新
  const percent = setProcess("#volume-bar", "percentMode", 0.5);
  myAudio.volume = percent;
  myAudio.addEventListener("timeupdate", (e) => {
    const currentTime = e.target.currentTime;
    const totalTime = e.target.duration;
    setProcess("#progress-bar", "percentMode", currentTime / totalTime);
    document.querySelector(".song-progress .current-time").innerText =
      formatSongTime(currentTime * 1000);
  });
  // 进度条控制
  document.querySelector("#progress-bar").addEventListener("click", (e) => {
    const percent = setProcess("#progress-bar", "positionMode", e.clientX);
    const totalTime = myAudio.duration;
    myAudio.currentTime = percent * totalTime;
    isPlayProxy.isPlay = true;
  });
  document.querySelector("#volume-bar").addEventListener("click", (e) => {
    const percent = setProcess("#volume-bar", "positionMode", e.clientX);
    myAudio.volume = percent;
    isPlayProxy.isPlay = true;
  });
}

/**
 * @description: 通过改变 musicId 达到播放模式控制的目的
 * @param {*} control：播放模式 mode == 0 --> 顺序播放；mode == 1 --> 随机播放；mode == 2 --> 单曲循环；
 * @return {*}
 */
function changeMusicId(control = "next") {
  let musicId = window.localStorage.getItem("musicId") || 1813926556;
  const mode = window.localStorage.getItem("musicMode") || 0;
  if (mode == 2) return musicId;

  const songList = JSON.parse(window.localStorage.getItem("songList")) || [];
  const songs = songList.length;
  let index = songList.findIndex((item) => item.id == musicId);
  if (mode == 1) {
    index = Math.floor(Math.random() * songs);
  } else if (mode == 0 && control == "next") {
    index = ++index % songs;
  } else if (mode == 0 && control == "prev") {
    index = --index % songs;
  }
  musicId = songs > 0 ? songList[index].id : musicId;
  window.localStorage.setItem("musicId", musicId);
  return musicId;
}

/**
 * @description: 初始化音乐播放器控制栏
 * @param {*} id :音乐的id
 * @return {*}
 */
export async function initPlayerControl(reloadAudio = true) {
  let musicId = Number(window.localStorage.getItem("musicId") || 355992);
  //修改播放器底部控制栏对应的href值，以便跳转页面的时候能拿到歌曲id
  PlayerCoverBackMode("player", musicId);
  console.log("🚀 ~ file: control.js ~ line 49 ~ initPlayerControl ~ musicId", musicId)
  //加载歌曲
  const musicSrc = await getAudioSrc(musicId);
  const musicData = await getAudioInfo(musicId);

  let songInfo;
  musicData && (songInfo = musicData.songs[0]);
  playerControlRender(songInfo);
  const myAudio = document.querySelector("#myAudio");
  myAudio.src = musicSrc;
  if (reloadAudio) {
    isPlayProxy.isPlay = true;
    myAudio.play()
  }
  // 初始化播放列表
  playerListRender();
}

/**
 * @description: 初始化播放列表
 * @param {*}
 * @return {*}
 */
export function playerListRender() {
  const playerListUl = document.querySelector(".player-list-ul");
  const playerListArr =
    JSON.parse(window.localStorage.getItem("songList")) || [];
  const musicId = window.localStorage.getItem("musicId");
  if (!playerListArr.length) {
    playerListUl.innerHTML = `
        <li class="player-list-li d-flex justify-content-start">
            请添加你喜欢的音乐
        </li>
        `;
  } else {
    const tempStr = playerListArr
      .map(
        (item) =>
          `<li class="player-list-li d-flex justify-content-start pointer " data-id='${item.id
          }'>
            <svg class='icon ${musicId == item.id ? "" : "opacity"
          }' aria-hidden="true">
                <use xlink:href="#icon-bofangzhong"></use>
            </svg>
            <div class="song-name single-text-omitted">${item.name}</div>
            <div class="singer">${item.ar[0].name}</div>
            <div class="song-time">${formatSongTime(item.dt)}</div>
        </li>`
      )
      .join("");
    playerListUl.innerHTML = tempStr;
  }
}

function playerControlRender(songInfo) {
  //修改播放器控制栏的视图
  document.querySelector(".songname").innerText = songInfo.name;
  document.querySelector(".singer").innerText = songInfo.ar[0].name;
  document.querySelector(".total-time").innerText = formatSongTime(songInfo.dt);
  Array.from(
    document.querySelectorAll(".player-control-songinfo .img")
  ).forEach((item) => {
    item.innerHTML = `<img src=${songInfo.al.picUrl} alt='' >`;
  });
  document.querySelector(".player-control-unit #player-control").innerHTML = `
    <use xlink:href="#icon-zanting"></use>
    `;
  musicModeRender();
}

/**
 * @description: 点击底部播放栏封面图片，控制页面需要跳转的页面
 * @param {*} page 需要跳转到页面
 * @param {*} id  如果当前页是 recommend，那么 id 为 推荐歌单ID；如果当前页是 player ，那么 id 为 musicId
 * @return {*}
 */
export function PlayerCoverBackMode(page, id) {
  if (page == "player") {
    document
      .querySelector("#playerCover")
      .setAttribute("href", `#/player/:${id}`);
    document.querySelector("#playerCoverBack").classList.add("display-none");
    document.querySelector("#playerCover").classList.remove("display-none");
  } else if (page == "recommend") {
    document
      .querySelector("#playerCoverBack")
      .setAttribute("href", `#/recommendList/:${id}`);
    document.querySelector("#playerCover").classList.add("display-none");
    document.querySelector("#playerCoverBack").classList.remove("display-none");
  }
}

/**
 * @description: 设置进度条的进度
 * @param {*} eleName
 * @param {*} mode
 * @param {*} eleWidth
 * @return {*}
 */
function setProcess(eleName, mode, eleWidth) {
  const progressBar = document.querySelector(eleName);
  const { left, width } = progressBar.getBoundingClientRect();

  let percent;
  if (mode == "percentMode") {
    percent = eleWidth;
  } else if (mode == "positionMode") {
    let distance = eleWidth - left;
    percent = distance / width;
  }

  document.querySelector(`${eleName} .progress-bar`).style.width = `${(
    percent * 100
  ).toFixed(2)}%`;
  document.querySelector(`${eleName} .progress-dot`).style.left = `${Math.round(percent * width) - 2
    }px`;
  return percent;
}