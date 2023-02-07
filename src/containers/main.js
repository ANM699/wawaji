import { useRef, useState, useEffect } from "react";
import { Popup, SafeArea, Mask, Toast, Tabs, Badge, Avatar } from "antd-mobile";
import { CloseCircleFill } from "antd-mobile-icons";
import wx from "weixin-js-sdk";
import TCPlayer from "../components/tc-player";
import VideoPlayer from "../components/video-player";
import CustomButton from "../components/custom-button";
import CtrlPanel from "../components/ctrl-panel";
import start_game from "../assets/start_game.png";
import waitting from "../assets/waitting.png";
import instruction from "../assets/instruction.png";
import recharge from "../assets/recharge.png";
import camera from "../assets/camera.png";
import muted_on from "../assets/muted_on.png";
import muted_off from "../assets/muted_off.png";
import wifi_green from "../assets/wifi_green.png";
import rc10 from "../assets/rc10.png";
import music from "../assets/music.mp3";
import "./main.css";

const sources = {
  horizontal: "webrtc://ziyougouwu-livev4.bestvcdn.com.cn/live/wawaji",
  vertical: "webrtc://ziyougouwu-livev4.bestvcdn.com.cn/live/wawaji2",
};
function Main({ route, machineState }) {
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const [curSrc, setCurSrc] = useState("horizontal");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showGoods, setShowGoods] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  //游戏状态(GAMEREADY:重新开始,GAMESTART:游戏中,GAMEOVER:游戏结束)
  const [gameState, setGameState] = useState("GAMEREADY");
  //游戏结果(SUCCESS,FAILED)
  const [gameRes, setGameRes] = useState(null);

  useEffect(() => {
    wx.config({});
  }, []);

  useEffect(() => {
    clearTimeout(tickRef.current);
    if (timeLeft > 0) {
      tickRef.current = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          handleCmd("GRAP");
        }
      }, 1000);
    }
  }, [timeLeft]);

  const handlePlayerReady = (player) => {
    playerRef.current = player;
    player.src(sources[curSrc]);
    wx.ready(() => {
      console.log("wx is ready");
      player.src(sources[curSrc]);
      audioRef.current.play();
    });
  };

  const toggleCamera = () => {
    const newSrc = curSrc === "vertical" ? "horizontal" : "vertical";
    setCurSrc(newSrc);
    playerRef.current.src(sources[newSrc]);
  };

  const handleCmd = (cmd) => {
    Toast.show({
      content: cmd,
    });
    if (cmd === "GRAP") {
      gameOver();
    }
  };

  const gameStart = () => {
    setGameState("GAMESTART");
    setShowGoods(false);
    setGameRes(null);
    setTimeLeft(30);
  };
  const gameOver = () => {
    setGameState("GAMEOVER");
    setTimeLeft(0);
    setIsLoading(true);
    setTimeout(() => {
      setGameRes(Math.random() > 0.3 ? "FAILED" : "SUCCESS");
      setIsLoading(false);
    }, 1000);
  };
  const gameReady = () => {
    setGameState("GAMEREADY");
    clearTimeout(tickRef.current);
    setGameRes(null);
  };

  return (
    <>
      <div className="main">
        <div className=" rounded-2xl overflow-hidden relative">
          {/* <VideoPlayer onReady={handlePlayerReady} /> */}
          <TCPlayer onReady={handlePlayerReady} />
          <div
            className=" absolute right-4 bottom-16 px-2 py-3 flex flex-col justify-between space-y-2"
            style={{
              background: "rgba(106, 106, 108, .5)",
              borderRadius: "5rem",
            }}
          >
            <CustomButton>
              <img
                onClick={() => setMuted(!muted)}
                style={{ width: 25 }}
                src={muted ? muted_on : muted_off}
                alt=""
              />
            </CustomButton>
            <CustomButton>
              <img
                onClick={toggleCamera}
                style={{ width: 25 }}
                src={camera}
                alt=""
              />
            </CustomButton>
          </div>
          <div
            className=" absolute right-4 bottom-3 px-2 py-1 flex justify-between items-center space-x-1"
            style={{ background: "rgba(106, 106, 108, .5)", borderRadius: 50 }}
          >
            <img style={{ width: 12, height: 12 }} src={wifi_green} alt="" />
            <span className=" text-xs" style={{ color: "#C6FF9A" }}>
              47ms
            </span>
          </div>
        </div>
        {gameState === "GAMEREADY" ? (
          <div className="p-4 flex justify-between items-start">
            <CustomButton enable={machineState === "FREE"}>
              <div className=" relative">
                <img
                  onClick={() => setShowGoods(true)}
                  style={{ width: 187, height: 110 }}
                  src={machineState === "FREE" ? start_game : waitting}
                  alt=""
                />
                {machineState === "FREE" ? (
                  <span className=" absolute bottom-5 w-full text-center text-white font-semibold">
                    35币/次
                  </span>
                ) : (
                  <div className=" absolute top-0 bottom-0 left-0 right-0 p-7 text-white font-semibold flex justify-start items-center">
                    <Avatar
                      style={{
                        "--size": "52px",
                        borderRadius: "50%",
                        border: "3px solid #FFFFFF",
                        flexShrink: 0,
                      }}
                    />
                    <div className=" flex flex-col items-start px-2">
                      <span>季*飞</span>
                      <span>游戏中</span>
                    </div>
                  </div>
                )}
              </div>
            </CustomButton>
            {/* {machineState === "FREE" ? (
              <CustomButton>
                <div className=" relative">
                  <img
                    onClick={() => setShowGoods(true)}
                    style={{ width: 187, height: 110 }}
                    src={start_game}
                    alt=""
                  />
                  <span className=" absolute bottom-5 w-full text-center text-white font-semibold">
                    35币/次
                  </span>
                </div>
              </CustomButton>
            ) : (
              <CustomButton enable={false}>
                <div className=" relative">
                  <img
                    style={{ width: 187, height: 110 }}
                    src={waitting}
                    alt=""
                  />
                  <div className=" absolute top-0 bottom-0 left-0 right-0 p-7 text-white font-semibold flex justify-start items-center">
                    <Avatar
                      style={{
                        "--size": "52px",
                        borderRadius: "50%",
                        border: "3px solid #FFFFFF",
                        flexShrink: 0,
                      }}
                    />
                    <div className=" flex flex-col items-start px-2">
                      <span>季*飞</span>
                      <span>游戏中</span>
                    </div>
                  </div>
                </div>
              </CustomButton>
            )} */}

            <div className=" flex flex-col items-center">
              <CustomButton>
                <img
                  onClick={() => setShowPopup(true)}
                  style={{ width: 110, height: 110 }}
                  src={recharge}
                  alt=""
                />
              </CustomButton>
              <span className="font-semibold">余币：34</span>
            </div>
          </div>
        ) : (
          <div className="p-4 flex justify-between items-center">
            <CtrlPanel
              timeLeft={timeLeft}
              enable={gameState === "GAMESTART"}
              handleCmd={handleCmd}
            ></CtrlPanel>
          </div>
        )}
        <div
          style={{ display: gameState === "GAMEREADY" ? "block" : "none" }}
          className=" rounded-2xl bg-white overflow-auto"
        >
          <Tabs
            defaultActiveKey="goods"
            activeLineMode="auto"
            style={{
              "--active-line-color": "transparent",
              "--active-title-color": "#E75706",
              "--title-font-size": "14px",
              "--content-padding": 0,
            }}
            className=" font-semibold"
          >
            <Tabs.Tab title="奖品详情" key="goods">
              <img className=" w-full" src={instruction} alt="" />
            </Tabs.Tab>
            <Tabs.Tab title="游戏记录" key="records">
              <div className=" flex flex-col">
                {Array(13)
                  .fill("1")
                  .map((v, index) => (
                    <div
                      key={index}
                      style={{ background: "#FFF6EF" }}
                      className=" flex justify-between items-center rounded-lg p-2 mx-4 my-2 text-sm"
                    >
                      <Avatar
                        style={{ "--size": "34px", borderRadius: "50%" }}
                      />
                      <span className=" flex-grow mx-2 text-black">
                        nickname
                      </span>
                      <span>2024-10-31 18:43:09</span>
                    </div>
                  ))}
              </div>
            </Tabs.Tab>
            <Tabs.Tab
              title={<Badge content={Badge.dot}>抓中记录</Badge>}
              key="my_success_records"
            >
              <div className=" flex flex-col">
                {Array(7)
                  .fill(1)
                  .map((v) => Math.random())
                  .map((v, index) => (
                    <div
                      key={index}
                      style={{ background: "#FFF6EF" }}
                      className=" flex justify-between items-center rounded-lg p-2 mx-4 my-1 text-sm"
                    >
                      <Avatar style={{ "--size": "58px" }} />
                      <div className=" flex flex-col justify-start flex-grow mx-2">
                        <span className=" text-black ">商品名称</span>
                        <span style={{ fontSize: "10px", marginTop: "6px" }}>
                          2024-10-31 18:43:09
                        </span>
                      </div>
                      <span style={{ color: "#FF5C00" }}>
                        {v <= 0.33
                          ? "待发货"
                          : v <= 0.66
                          ? "申请发货"
                          : "已发货"}
                      </span>
                    </div>
                  ))}
              </div>
            </Tabs.Tab>
          </Tabs>
        </div>
      </div>
      {/* <Popup
        visible={showGoods}
        onMaskClick={() => {
          setShowGoods(false);
        }}
        bodyStyle={{
          borderTopLeftRadius: ".5rem",
          borderTopRightRadius: ".5rem",
          background: "#F5F6FA",
          overflow: "hidden",
        }}
      >
        <div
          className="font-semibold p-3 flex justify-between"
          style={{ color: "#6A6868", background: "#ffffff" }}
        >
          选择想要的奖品，抓中娃娃即可兑换
          <CloseCircleFill
            onClick={() => {
              setShowGoods(false);
            }}
            fontSize={24}
            color="#D9D9D9"
          />
        </div>
        <div
          style={{
            gridTemplateColumns: "repeat(3,112px)",
            height: "50vh",
          }}
          className=" p-3 grid place-content-between gap-y-2 overflow-y-scroll"
        >
          {Array(13)
            .fill("1")
            .map((v, index) => (
              <CustomButton key={index}>
                <img
                  style={{ width: "100%" }}
                  src={rc10}
                  alt=""
                  onClick={startGame}
                />
              </CustomButton>
            ))}
        </div>
        <SafeArea position="bottom" />
      </Popup> */}
      <Mask visible={isLoading}></Mask>
      <Popup
        visible={showPopup}
        onMaskClick={() => {
          setShowPopup(false);
        }}
        bodyStyle={{
          borderTopLeftRadius: ".5rem",
          borderTopRightRadius: ".5rem",
          background: "#F5F6FA",
          overflow: "hidden",
        }}
      >
        <div className="font-semibold p-3 flex justify-between bg-white">
          选择充值金额
          <CloseCircleFill
            onClick={() => {
              setShowPopup(false);
            }}
            fontSize={24}
            color="#D9D9D9"
          />
        </div>
        <div
          style={{
            gridTemplateColumns: "repeat(3,112px)",
          }}
          className=" p-3 grid place-content-between gap-y-2"
        >
          {Array(9)
            .fill("1")
            .map((v, index) => (
              <CustomButton key={index}>
                <img style={{ width: "100%" }} src={rc10} alt="" />
              </CustomButton>
            ))}
        </div>
        <SafeArea position="bottom" />
      </Popup>
      <Mask visible={showGoods}>
        <div className="overlayContainer">
          <div className="p-3 flex justify-between bg-white w-full font-semibold">
            选择奖品，开始游戏
            <CloseCircleFill
              onClick={() => {
                setShowGoods(false);
              }}
              fontSize={24}
              color="#D9D9D9"
            />
          </div>
          <div
            className=" p-3 w-full overflow-scroll"
            style={{ height: "60vh" }}
          >
            <div className="flex w-full justify-between ">
              <img style={{ width: 106, height: 106 }} src={rc10} alt="" />
              <div className=" flex-grow flex flex-col items-start ml-2">
                <span>商品名称</span>
                <span>商品描述</span>
              </div>
            </div>
            <div className="w-full text-left my-2">
              选择一款奖品，立即开始游戏
            </div>
            <div
              style={{
                gridTemplateColumns: "repeat(3,106px)",
              }}
              className=" grid place-content-between gap-y-2 overflow-y-scroll w-full"
            >
              {Array(8)
                .fill("1")
                .map((v, index) => (
                  <CustomButton key={index}>
                    <img
                      style={{ width: "100%", height: 106 }}
                      src={rc10}
                      alt=""
                      onClick={gameStart}
                    />
                  </CustomButton>
                ))}
            </div>
          </div>
        </div>
      </Mask>
      <Mask visible={gameRes && gameState === "GAMEOVER"}>
        {gameRes === "SUCCESS" ? (
          <div className="overlayDialog">
            <div className=" text-2xl">恭喜您抓到了</div>
            <div className=" flex justify-between w-full">
              <CustomButton>
                <div className="dialogButton" onClick={() => route("address")}>
                  申请发货
                </div>
              </CustomButton>
              <CustomButton>
                <div className="dialogButton right" onClick={gameStart}>
                  再来一局
                </div>
              </CustomButton>
            </div>
          </div>
        ) : gameRes === "FAILED" ? (
          <div className="overlayDialog">
            <div className=" text-2xl">差一点就抓到了</div>
            <div className=" flex justify-between w-full">
              <CustomButton>
                <div className="dialogButton" onClick={gameReady}>
                  稍后再试
                </div>
              </CustomButton>
              <CustomButton>
                <div className="dialogButton right" onClick={gameStart}>
                  再来一局
                </div>
              </CustomButton>
            </div>
          </div>
        ) : null}
        {/* <div className="overlayDialog">
          <div className=" text-2xl">
            {gameRes === "SUCCESS" ? "恭喜您抓到了" : "差一点就抓到了"}
          </div>
          <div className=" flex justify-between w-full">
            <CustomButton>
              <div
                className="dialogButton"
                onClick={() => {
                  setGameState("GAMEREADY");
                }}
              >
                {gameRes === "SUCCESS" ? "申请发货" : "稍后再试"}
              </div>
            </CustomButton>
            <CustomButton>
              <div
                className="dialogButton right"
                onClick={() => setGameState("GAMESTART")}
              >
                再来一局
              </div>
            </CustomButton>
          </div>
        </div> */}
      </Mask>
      <audio
        ref={audioRef}
        muted={muted}
        autoPlay
        className=" absolute"
        style={{ display: "none" }}
        src={music}
        loop
      />
    </>
  );
}

export default Main;
