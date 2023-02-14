import { useRef, useState, useEffect, useCallback } from "react";
import _ from "loadsh";
import Cookies from "js-cookie";
import {
  Popup,
  SafeArea,
  Mask,
  Toast,
  Tabs,
  Badge,
  Avatar,
  CenterPopup,
} from "antd-mobile";
import {
  CloseCircleFill,
  EnvironmentOutline,
  TruckOutline,
} from "antd-mobile-icons";
import wx from "weixin-js-sdk";
import {
  appId,
  getRoomInfo,
  getGoodsInfo,
  getAllSepcGoodsInfo,
  createOrder,
  getMyAccount,
  getWxConfig,
  getRecords,
  getMyDealRecords,
  grabReward,
  ws,
} from "../api";
import TCPlayer from "../components/tc-player";
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
import wifi_yellow from "../assets/wifi_yellow.png";
import wifi_red from "../assets/wifi_red.png";
import music from "../assets/music.mp3";
import "./main.css";

function name(str) {
  return str.length <= 1 ? str + "*" : str.replace(/(^.).*(.$)/, "$1*$2");
}

const initSocket = () => {
  let websocket = null;
  websocket = new WebSocket(ws);
  websocket.onopen = () => {
    console.log("WebSocket连接成功.");
    const msg = {
      cmd: "request_status",
      ...JSON.parse(Cookies.get("userInfo")),
    };
    websocket.send(JSON.stringify(msg));
  };
  websocket.onclose = (event) => {
    console.log("WebSocket关闭: ", event);
    const msg = {
      cmd: "exit_room",
      ...JSON.parse(Cookies.get("userInfo")),
    };
    websocket.send(JSON.stringify(msg));
  };
  websocket.onerror = (event) => {
    console.log("WebSocket发生错误: ", event);
  };
  return websocket;
};

function Main() {
  const wsRef = useRef(null);
  const playerRef = useRef(null);
  const playerRef2 = useRef(null);
  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const curOrderIdRef = useRef(null);
  const curSpecGoodsIdRef = useRef(0);
  const accountRef = useRef(0);
  const userInfoRef = useRef({});
  const costRef = useRef(0);
  const [curSrc, setCurSrc] = useState(1);
  const [cost, setCost] = useState(0);
  const [curUser, setCurUser] = useState({});
  const [userInfo, setUserInfo] = useState({});
  const [account, setAccount] = useState(0);
  const [records, setRecords] = useState([]);
  const [myDealRecords, setMyDealRecords] = useState([]);
  const [virtual, setVirtual] = useState([]);
  const [users, setUsers] = useState({ count: 0, list: [] });
  const [goods, setGoods] = useState({});
  const [delay, setDelay] = useState(36);
  const [specGoods, setSpecGoods] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showGoods, setShowGoods] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  //游戏状态(GAMEREADY:不在游戏中,INGAME:游戏中)
  const [gameState, setGameState] = useState("GAMEREADY");
  //娃娃机状态(OFFLINE:离线,BUSY:使用中,FREE:空闲;ERROR:故障)
  const [machineState, setMachineState] = useState("FREE");
  //游戏结果(SUCCESS,FAILED)
  const [gameRes, setGameRes] = useState(null);

  useEffect(() => {
    wsRef.current = initSocket();
    if (Cookies.get("userInfo")) {
      const user = JSON.parse(Cookies.get("userInfo"));
      userInfoRef.current = user;
      setUserInfo(user);
    }
    wsRef.current.onmessage = (event) => {
      handleMsg(event.data);
    };
    //获取账户信息
    getMyAccount().then((res) => {
      if (res.code === 0) {
        setAccount(res.data.account);
        accountRef.current = res.data.account;
      }
    });
    //获取游戏记录
    getRecords().then((res) => {
      res.code === 0 && setRecords(res.data);
    });
    //获取我的抓中记录
    getMyDealRecords().then((res) => {
      res.code === 0 && setMyDealRecords(res.data);
    });
    //获取房间相关信息
    getRoomInfo().then((res) => {
      if (res.code === 0) {
        const { merchant_id, gift_id, once_money } = res.data;
        // setRoom(res.data);
        setCost(once_money);
        costRef.current = once_money;
        getAllSepcGoodsInfo(merchant_id).then((res) => {
          res.code === 0 && setVirtual(res.data);
        });
        getAllSepcGoodsInfo(gift_id).then((res) => {
          res.code === 0 && setSpecGoods(res.data);
        });
        getGoodsInfo(gift_id).then((res) => {
          res.code === 0 && setGoods(res.data);
        });
        getWxConfig(window.location.href.split("#")[0]).then((r) => {
          if (r.code === 0) {
            const { sign, noncestr, timestamp } = r.data;
            //配置微信sdk
            wx.config({
              debug: false, // 开启调试模式,调用的所有 api 的返回值会在客户端 alert 出来，若要查看传入的参数，可以在 pc 端打开，参数信息会通过 log 打出，仅在 pc 端时才会打印。
              appId: appId, // 必填，公众号的唯一标识
              timestamp, // 必填，生成签名的时间戳
              nonceStr: noncestr, // 必填，生成签名的随机串
              signature: sign, // 必填，签名
              jsApiList: ["chooseWXPay", "openAddress"],
            });
            wx.ready(() => {
              playerRef.current.src(res.data.live_url);
              playerRef.current.play();
              playerRef2.current.src(res.data.live_url2);
              playerRef2.current.play();
              audioRef.current.play();
            });
          }
        });
      }
    });
    return () => {
      wsRef.current && wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    clearTimeout(tickRef.current);
    if (timeLeft > 0 && gameState === "INGAME") {
      tickRef.current = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          // gameOver();
          handleCmd(4);
        }
      }, 1000);
    }
  }, [timeLeft, gameState]);

  const handlePlayerReady = (player) => {
    playerRef.current = player;
  };
  const handlePlayerReady2 = (player) => {
    playerRef2.current = player;
  };

  const toggleCamera = () => {
    setCurSrc(curSrc === 1 ? 2 : 1);
  };

  // UP:0 DOWN:1 LEFT:2 RIGHT:3 GRAP:4
  const handleCmd = (cmd) => {
    const msg = {
      cmd: "operation",
      type: cmd,
      ...userInfo,
    };
    if (wsRef.current && wsRef.current.readyState === 1)
      wsRef.current.send(JSON.stringify(msg));
    if (cmd === 4) {
      gameOver();
    }
  };

  const handleMsg = (msg) => {
    const data = JSON.parse(msg);
    const { timestamp } = data;
    if (timestamp) {
      const now = Date.now();
      let delay = now - timestamp;
      console.log("收到消息：", data, now, delay);
      if (delay < 0) delay = Math.floor(Math.random() * 50);
      setDelay(delay);
      // if (delay > 200) {
      //   Toast.show({
      //     content: "网络状况不佳",
      //     maskClickable: false,
      //     duration: 1000,
      //   });
      // }
    }
    //收到能否开始游戏
    if (data.cmd === "start_game") {
      const { ret } = data;
      if (ret === 1) {
        //可以开始游戏
        setGameState("INGAME");
        setShowGoods(false);
        setGameRes(null);
        // setTimeLeft(30);
        accountRef.current = accountRef.current - costRef.current;
        setAccount(accountRef.current);
        return;
      } else if (ret === -1) {
        //金币不足
        Toast.show({
          content: "余币不足,请充值",
          maskClickable: false,
          duration: 1000,
          afterClose: () => {
            setShowGoods(false);
            setShowPopup(true);
          },
        });
        return;
      } else if (ret === -2) {
        //库存不足
        Toast.show({
          content: "库存不足,请重新选择",
          maskClickable: false,
          duration: 1000,
          afterClose: () => {
            setShowGoods(true);
          },
        });
        return;
      } else if (ret === -3) {
        //机器被占用
        Toast.show({
          content: "机器繁忙，请稍后再试",
          maskClickable: false,
          duration: 1000,
          afterClose: () => {
            gameReady();
          },
        });
        return;
      }
    }
    //收到机器状态
    if (data.cmd === "server_status") {
      const { status } = data;
      if (status === "busy") {
        setMachineState("BUSY");
        const { current_user } = data;
        setCurUser(current_user);
        const { uid, start_time } = current_user;
        const tl = Math.round((start_time + 30000 - Date.now()) / 1000);
        if (uid === userInfoRef.current.uid && tl > 0) {
          //继续游戏
          setGameState("INGAME");
          setShowGoods(false);
          setTimeLeft(tl);
        }
        return;
      } else if (status === "leisure") {
        setMachineState("FREE");
        //更新游戏记录
        getRecords().then((res) => {
          res.code === 0 && setRecords(res.data);
        });
        return;
      } else if (status === "offline") {
        setMachineState("OFFLINE");
        Toast.show({
          content: "机器不在线",
          maskClickable: false,
          duration: 1000,
        });
        return;
      } else if (status === "error") {
        setMachineState("ERROR");
        const { desc } = data;
        Toast.show({
          content: desc,
          maskClickable: false,
          duration: 1000,
        });
        return;
      }
    }
    //收到房间人员信息
    if (data.cmd === "user_list") {
      setUsers({ count: data.count, list: data.user_list });
      return;
    }
    //收到游戏结果
    if (data.cmd === "game_ret") {
      setGameRes(data.ret === 0 ? "FAILED" : "SUCCESS");
      if (data.ret === 1) {
        curOrderIdRef.current = data.orderId;
        //更新我的抓中记录
        getMyDealRecords().then((r) => {
          r.code === 0 && setMyDealRecords(r.data);
        });
      }
      return;
    }
  };

  const gameStart = useCallback(
    _.throttle(
      (specId) => {
        curSpecGoodsIdRef.current = specId;
        const msg = {
          cmd: "start_game",
          specGoodsId: specId,
          ...userInfo,
        };
        if (wsRef.current && wsRef.current.readyState === 1)
          wsRef.current.send(JSON.stringify(msg));
      },
      500,
      { trailing: false }
    ),
    [userInfo]
  );

  const gameOver = () => {
    setTimeLeft(0);
  };
  const gameReady = () => {
    setGameState("GAMEREADY");
    setShowGoods(false);
    clearTimeout(tickRef.current);
    setGameRes(null);
  };
  const selectGoods = () => {
    console.log("点击了开始游戏");
    if (account >= cost) {
      setShowGoods(true);
    } else {
      Toast.show({
        content: "余币不足,请充值",
        maskClickable: false,
        duration: 1000,
        afterClose: () => {
          setShowPopup(true);
        },
      });
    }
  };
  const openAddress = (orderId) => {
    gameReady();
    if (!orderId) return;
    wx.openAddress({
      success: function (res) {
        const data = {
          orderId,
          userName: res.userName,
          telNumber: res.telNumber,
          provinceName: res.provinceName,
          cityName: res.cityName,
          detailInfo: res.detailInfo,
        };
        grabReward(data).then((res) => {
          if (res.code === 0) {
            Toast.show({
              content: "等待发货",
              maskClickable: false,
              duration: 1000,
            });
            //更新我的抓中记录
            getMyDealRecords().then((r) => {
              r.code === 0 && setMyDealRecords(r.data);
            });
          } else {
            Toast.show({
              content: `${res.code}:${res.error}`,
              maskClickable: false,
              duration: 1000,
            });
          }
        });
      },
    });
  };

  const wxpay = (specGoodsId, val) => {
    createOrder(specGoodsId).then((res) => {
      if (res.code === 0) {
        const {
          timeStamp,
          nonceStr,
          paySign,
          package: packageValue,
          signType,
        } = res.data;
        wx.chooseWXPay({
          timestamp: timeStamp, // 支付签名时间戳，注意微信 jssdk 中的所有使用 timestamp 字段均为小写。但最新版的支付后台生成签名使用的 timeStamp 字段名需大写其中的 S 字符
          nonceStr: nonceStr, // 支付签名随机串，不长于 32 位
          package: packageValue, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=\*\*\*）
          signType, // 微信支付V3的传入 RSA ,微信支付V2的传入格式与V2统一下单的签名格式保持一致
          paySign, // 支付签名
          success: () => {
            // 支付成功后的回调函数
            Toast.show({
              content: "支付成功",
              maskClickable: false,
              duration: 1000,
              afterClose: () => {
                accountRef.current = accountRef.current + val;
                setAccount(accountRef.current);
                setShowPopup(false);
              },
            });
          },
          fail: function () {},
        });
      } else {
        Toast.show({
          content: `${res.code}:${res.error}`,
          maskClickable: false,
          duration: 1000,
        });
      }
    });
  };

  return (
    <>
      <div className="main">
        <div
          className=" rounded-2xl overflow-hidden relative"
          style={{
            backfaceVisibility: "hidden",
            transform: "translate3d(0,0,0)",
          }}
        >
          <div style={{ display: curSrc === 1 ? "block" : "none" }}>
            <TCPlayer onReady={handlePlayerReady} id="player1" />
          </div>
          <div style={{ display: curSrc === 2 ? "block" : "none" }}>
            <TCPlayer onReady={handlePlayerReady2} id="player2" />
          </div>
          <div className=" absolute top-0 p-2 flex justify-start items-center bg-black bg-opacity-30 w-full">
            <span className=" text-sm text-white font-semibold mx-1">
              {users.count}人
            </span>
            {users.list.map((item, index) => (
              <Avatar
                key={index}
                src={item.avatar}
                style={{
                  "--size": "24px",
                  borderRadius: "50%",
                  border: "1px solid #FFFFFF",
                  marginRight: -6,
                }}
              />
            ))}
          </div>
          <div
            className=" absolute right-4 bottom-16 px-2 py-3 flex flex-col justify-between space-y-2"
            style={{
              background: "rgba(106, 106, 108, .5)",
              borderRadius: "80px",
            }}
          >
            <CustomButton>
              <img
                onClick={() => setMuted(!muted)}
                className="videoImg"
                src={muted ? muted_on : muted_off}
                alt=""
              />
            </CustomButton>
            <CustomButton>
              <img
                onClick={toggleCamera}
                className="videoImg"
                src={camera}
                alt=""
              />
            </CustomButton>
          </div>
          <div
            className=" absolute right-4 bottom-3 px-2 py-1 flex justify-between items-center space-x-1"
            style={{ background: "rgba(106, 106, 108, .5)", borderRadius: 50 }}
          >
            <img
              className="wifiImg"
              src={
                delay <= 100
                  ? wifi_green
                  : delay <= 200
                  ? wifi_yellow
                  : wifi_red
              }
              alt=""
            />
            <span
              className=" text-xs"
              style={{
                color:
                  delay <= 100
                    ? "#C6FF9A"
                    : delay <= 200
                    ? "#FFCC00"
                    : "#C30303",
              }}
            >
              {delay}ms
            </span>
          </div>
        </div>
        {gameState === "GAMEREADY" ? (
          <div className="p-4 flex justify-between items-start">
            <div className=" flex flex-col items-center">
              <CustomButton enable={machineState === "FREE"}>
                <div className=" relative">
                  <img
                    onClick={selectGoods}
                    className="gameStartImg"
                    src={machineState === "FREE" ? start_game : waitting}
                    alt=""
                  />
                  {machineState === "FREE" ? (
                    <span className=" absolute bottom-5 w-full text-center text-white font-semibold">
                      {cost}币/次
                    </span>
                  ) : machineState === "BUSY" ? (
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
                        <span>{name(curUser.nickname)}</span>
                        <span>游戏中</span>
                      </div>
                    </div>
                  ) : (
                    <div className=" absolute top-0 bottom-0 left-0 right-0 p-7 text-white font-semibold flex justify-center items-center">
                      <span>
                        {machineState === "OFFLINE" ? "机器不在线" : "机器故障"}
                      </span>
                    </div>
                  )}
                </div>
              </CustomButton>
              <span className="font-semibold">ID：{userInfo.uid}</span>
            </div>

            <div className=" flex flex-col items-center">
              <CustomButton>
                <img
                  onClick={() => setShowPopup(true)}
                  className="rechargeImg"
                  src={recharge}
                  alt=""
                />
              </CustomButton>
              <span className="font-semibold">余币：{account}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 flex justify-between items-center">
            <CtrlPanel
              timeLeft={timeLeft}
              enable={gameState === "INGAME" && timeLeft > 0}
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
                {records.map((item, index) => (
                  <div
                    key={index}
                    style={{ background: "#FFF6EF" }}
                    className=" flex justify-between items-center rounded-lg p-2 mx-4 my-2 text-sm"
                  >
                    <Avatar
                      style={{ "--size": "2rem", borderRadius: "50%" }}
                      src={item.avatar}
                    />
                    <span className=" flex-grow mx-2 text-black">
                      {name(item.nick_name)}
                    </span>
                    <span>{item.create_time}</span>
                  </div>
                ))}
              </div>
            </Tabs.Tab>
            <Tabs.Tab
              title={
                <Badge
                  content={
                    myDealRecords.some((item) => item.status === 0)
                      ? Badge.dot
                      : null
                  }
                >
                  抓中记录
                </Badge>
              }
              key="my_success_records"
            >
              <div className=" flex flex-col">
                {myDealRecords.map((item, index) => (
                  <div
                    onClick={() => {
                      if (item.status === 0) {
                        openAddress(item.order_id);
                      }
                    }}
                    key={index}
                    style={{ background: "#FFF6EF" }}
                    className=" flex flex-col rounded-lg p-2 mx-4 my-1 text-sm"
                  >
                    <div className=" flex justify-between items-center">
                      <Avatar
                        style={{ "--size": "3.625rem" }}
                        src={item.spec_img}
                      />
                      <div className=" flex flex-col justify-start flex-grow mx-2">
                        <span className=" text-black ">{item.goods_name}</span>
                        <span
                          style={{
                            fontSize: "0.625rem",
                            marginTop: "0.375rem",
                          }}
                        >
                          {item.create_time}
                        </span>
                      </div>
                      <span
                        style={{
                          color: item.status === 0 ? "#FF5C00" : "#6a6868",
                        }}
                      >
                        {item.status === 0
                          ? "申请发货"
                          : item.status === 1
                          ? "待发货"
                          : "已发货"}
                      </span>
                    </div>
                    {item.status !== 0 ? (
                      <div
                        className=" flex justify-start items-center mt-3"
                        style={{ fontSize: "0.625rem" }}
                      >
                        <EnvironmentOutline fontSize="0.875rem" />
                        <div className=" ml-3 flex flex-col justify-start">
                          <span>{item.addr_user + "  " + item.addr_phone}</span>
                          <span
                            className=" font-normal"
                            style={{ fontSize: "0.5rem" }}
                          >
                            {item.addr_province +
                              item.addr_city +
                              item.addr_detail}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {item.status === 2 ? (
                      <div
                        className=" flex justify-start items-center mt-3"
                        style={{ fontSize: "0.625rem" }}
                      >
                        <TruckOutline fontSize="0.875rem" />
                        <div className=" ml-3  flex flex-col justify-start">
                          <div>
                            快递单号：
                            <span className=" font-normal">
                              {item.shipping_code}
                            </span>
                          </div>
                          <div>
                            快递公司：
                            <span className=" font-normal">
                              {item.shipping_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Tabs.Tab>
          </Tabs>
        </div>
      </div>
      <Popup
        visible={showPopup}
        onMaskClick={() => {
          setShowPopup(false);
        }}
        bodyStyle={{
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
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
            fontSize="2rem"
            color="#D9D9D9"
          />
        </div>
        <div
          style={{
            gridTemplateColumns: "repeat(3,7rem)",
            paddingBottom: 24,
          }}
          className=" p-3 grid place-content-between gap-y-2"
        >
          {virtual.map((item, index) => (
            <CustomButton key={index}>
              <div
                className=" flex flex-col items-center bg-white rounded-lg font-semibold justify-between overflow-hidden"
                onClick={() => {
                  wxpay(item.item_id, item.virtual_money);
                }}
              >
                <span className=" mt-3" style={{ color: "#CB4D3D" }}>
                  {item.virtual_money}
                </span>
                <img src={item.spec_img} width="60 %" alt="" />
                <span
                  className=" w-full text-white text-center"
                  style={{
                    background: "#CB4D3D",
                    height: 26,
                  }}
                >
                  ¥ {item.price}
                </span>
              </div>
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
            className=" p-5 w-full overflow-scroll  text-sm"
            style={{ height: "60vh" }}
          >
            <div className="flex w-full justify-between ">
              <img
                className="rounded-xl"
                style={{ width: 106 }}
                src={goods.original_img}
                alt=""
              />
              <div className=" flex-grow flex flex-col items-start ml-3">
                <span className=" text-black font-semibold">
                  {goods.goods_name}
                </span>
                <span className=" mt-2">{goods.goods_remark}</span>
              </div>
            </div>
            <div className="w-full text-left my-2 text-black font-semibold ">
              选择一款奖品，立即开始游戏
            </div>
            <div
              style={{
                gridTemplateColumns: "repeat(3,95px)",
              }}
              className=" grid place-content-between gap-y-2 overflow-y-scroll w-full"
            >
              {specGoods.map((item, index) => (
                <CustomButton key={index}>
                  <div className=" flex flex-col items-center  font-semibold justify-start">
                    <img
                      className="rounded-xl"
                      src={item.spec_img}
                      alt=""
                      onClick={() => {
                        gameStart(item.item_id);
                      }}
                    />
                    <span style={{ fontSize: 10, lineHeight: 1.4 }}>
                      {item.spec[0]?.value}
                    </span>
                  </div>
                </CustomButton>
              ))}
            </div>
          </div>
        </div>
      </Mask>
      <CenterPopup visible={gameRes}>
        {gameRes === "SUCCESS" ? (
          <div className="overlayDialog">
            <div className=" text-2xl">恭喜您抓到了</div>
            <div className=" flex justify-between w-full">
              <CustomButton>
                {/* <div className="dialogButton" onClick={() => route("address")}> */}
                <div
                  className="dialogButton"
                  onClick={() => {
                    openAddress(curOrderIdRef.current);
                  }}
                >
                  申请发货
                </div>
              </CustomButton>
              <CustomButton>
                <div
                  className="dialogButton right"
                  onClick={() => {
                    gameStart(curSpecGoodsIdRef.current);
                  }}
                >
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
                <div
                  className="dialogButton right"
                  onClick={() => {
                    gameStart(curSpecGoodsIdRef.current);
                  }}
                >
                  再来一局
                </div>
              </CustomButton>
            </div>
          </div>
        ) : null}
      </CenterPopup>
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
