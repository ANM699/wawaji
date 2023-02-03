import { useRef, useState, useEffect } from "react";
import { Popup, SafeArea, Mask } from "antd-mobile";
import { CloseCircleFill } from "antd-mobile-icons";
import VideoPlayer from "./components/video-player";
import CustomButton from "./components/custom-button";
import CtrlPanel from "./components/ctrl-panel";
import start_game from "./assets/start_game.png";
import instruction from "./assets/instruction.png";
import recharge from "./assets/recharge.png";
import camera from "./assets/camera.png";
import muted_on from "./assets/muted_on.png";
import muted_off from "./assets/muted_off.png";
import wifi from "./assets/wifi.png";
import rc10 from "./assets/rc10.png";
import music from "./assets/music.mp3";
import "./App.css";

const sources = {
  vertical: {
    src: "http://220.161.87.62:8800/hls/0/index.m3u8",
    type: "application/x-mpegURL",
  },
  horizontal: {
    src: "http://220.161.87.62:8800/hls/1/index.m3u8",
    type: "application/x-mpegURL",
  },
};
function App() {
  const playerRef = useRef(null);
  const tickRef = useRef(null);
  const [curSrc, setCurSrc] = useState("vertical");
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showGoods, setShowGoods] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  //游戏状态(RESUME:重新开始,INGAME:游戏中,GAMEOVER:游戏结束)
  const [gameState, setGameState] = useState("RESUME");
  ////娃娃机状态(ONLINE:在线,OFFLINE:离线,BUSY:使用中,READY:就绪)
  const [machineState, setMachineState] = useState("READY");

  const handlePlayerReady = (player) => {
    playerRef.current = player;
    player.src(sources[curSrc].src);
    // player.getChild("LoadingSpinner").hide();
  };

  const toggleCamera = () => {
    const newSrc = curSrc === "vertical" ? "horizontal" : "vertical";
    setCurSrc(newSrc);
    playerRef.current.src(sources[newSrc].src);
  };

  const handleCmd = (cmd) => {
    console.log(cmd);
    if (cmd === "GRAP") {
      setGameState("GAMEOVER");
    }
  };

  const startGame = () => {
    setShowGoods(false);
    setGameState("INGAME");
  };

  const countDown = () => {
    if (tickRef.current) clearTimeout(tickRef.current);
    if (timeLeft > 0) {
      tickRef.current = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) setGameState("GAMEOVER");
      }, 1000);
    }
  };

  useEffect(() => {
    if (timeLeft) {
      countDown();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (gameState === "INGAME") {
      setTimeLeft(30);
    } else {
      tickRef.current && clearTimeout(tickRef.current);
    }
  }, [gameState]);

  return (
    <>
      <div className=" flex flex-col  p-2">
        <div className=" rounded-2xl overflow-hidden relative">
          <VideoPlayer onReady={handlePlayerReady} />
          <div
            className=" absolute right-4 bottom-14 p-2 flex flex-col justify-between space-y-2"
            style={{
              background: "rgba(106, 106, 108, .5)",
              borderRadius: "20px",
            }}
          >
            <CustomButton>
              <img
                onClick={() => setMuted(!muted)}
                style={{ width: 20 }}
                src={muted ? muted_on : muted_off}
                alt=""
              />
            </CustomButton>
            <CustomButton>
              <img
                onClick={toggleCamera}
                style={{ width: 20 }}
                src={camera}
                alt=""
              />
            </CustomButton>
          </div>
          <div
            className=" absolute right-4 bottom-3 px-2 py-1 flex justify-between items-center space-x-1"
            style={{ background: "rgba(106, 106, 108, .5)", borderRadius: 50 }}
          >
            <img style={{ width: 12, height: 12 }} src={wifi} alt="" />
            <span className=" text-xs" style={{ color: "#C6FF9A" }}>
              47ms
            </span>
          </div>
        </div>
        {gameState === "RESUME" ? (
          <div className="p-4 flex justify-between">
            <CustomButton>
              <div className=" relative">
                <img
                  onClick={() => setShowGoods(true)}
                  style={{ width: 187, height: 110 }}
                  src={machineState === "READY" ? start_game : start_game}
                  alt=""
                />
                <span className=" absolute bottom-5 w-full text-center text-white font-semibold">
                  35币/次
                </span>
              </div>
            </CustomButton>
            <div className=" flex flex-col items-center">
              <CustomButton>
                <img
                  onClick={() => setShowPopup(true)}
                  style={{ width: 110, height: 110 }}
                  src={recharge}
                  alt=""
                />
              </CustomButton>
              <span className="font-semibold" style={{ color: "#6A6868" }}>
                余币：34
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 flex justify-between items-center">
            <CtrlPanel
              timeLeft={timeLeft}
              enable={gameState === "INGAME"}
              handleCmd={handleCmd}
            ></CtrlPanel>
          </div>
        )}
        <div>抓中记录</div>
        <img className=" w-full" src={instruction} alt="" />
      </div>
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
        <div
          className="font-semibold p-3 flex justify-between"
          style={{ color: "#6A6868", background: "#ffffff" }}
        >
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
      <Popup
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
      </Popup>
      <Mask visible={gameState === "GAMEOVER"}>
        <div className="overlayContent">
          <div className=" text-2xl">差一点就抓到了</div>
          <div className=" flex justify-between w-full">
            <CustomButton>
              <div
                className="dialogButton"
                onClick={() => setGameState("RESUME")}
              >
                稍后再试
              </div>
            </CustomButton>
            <CustomButton>
              <div
                className="dialogButton right"
                onClick={() => setGameState("INGAME")}
              >
                再来一局
              </div>
            </CustomButton>
          </div>
        </div>
      </Mask>
      <audio
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

export default App;
