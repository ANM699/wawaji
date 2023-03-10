import { useRef, useState, useEffect, useCallback } from "react";
import _ from "loadsh";
import Cookies from "js-cookie";
import {
  Popup,
  SafeArea,
  Toast,
  Tabs,
  Badge,
  Avatar,
  CenterPopup,
  InfiniteScroll,
  ResultPage,
} from "antd-mobile";
import {
  CloseCircleFill,
  EnvironmentOutline,
  TruckOutline,
} from "antd-mobile-icons";
import wx from "weixin-js-sdk";
import {
  appId,
  redirect_uri,
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
  return str.length <= 1 ? str + "**" : str.replace(/(^.).*(.$)/, "$1**$2");
}

function Main({ room }) {
  const wsRef = useRef(null);
  const playerRef = useRef(null);
  const playerRef2 = useRef(null);
  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const curOrderIdRef = useRef(null);
  const userInfoRef = useRef({});
  const curSpecGoodsIdRef = useRef(0);
  const records_page = useRef(1);
  const myDealRecords_page = useRef(1);
  const accountRef = useRef(0);
  const costRef = useRef(0);
  const curSrcRef = useRef(1);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [hasMoreMyDealRecords, setHasMoreMyDealRecords] = useState(true);
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
  const [showReConnect, setShowReConnect] = useState(false);
  const [showGoods, setShowGoods] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  //????????????(GAMEREADY:???????????????,INGAME:?????????)
  const [gameState, setGameState] = useState("GAMEREADY");
  //???????????????(OFFLINE:??????,BUSY:?????????,FREE:??????;ERROR:??????)
  const [machineState, setMachineState] = useState("FREE");
  //????????????(SUCCESS,FAILED)
  const [gameRes, setGameRes] = useState(null);

  useEffect(() => {
    initSocket();
    if (Cookies.get("userInfo")) {
      const user = JSON.parse(Cookies.get("userInfo"));
      userInfoRef.current = user;
      setUserInfo(user);
    }
    curSpecGoodsIdRef.current = Cookies.get("curSpecGoodsId") || 0;
    //??????????????????
    getMyAccount().then((res) => {
      if (res.code === 0) {
        setAccount(res.data.account);
        accountRef.current = res.data.account;
      }
    });
    //??????????????????
    reqRecords();
    //????????????????????????
    reqMyDealRecords();
    //????????????????????????
    // getRoomInfo().then((res) => {
    // if (res.code === 0) {
    const { merchant_id, gift_id, once_money } = room;
    // setRoom(res.data);
    setCost(once_money);
    costRef.current = once_money;
    getAllSepcGoodsInfo(merchant_id).then((res) => {
      res.code === 0 && setVirtual(res.data);
    });
    getGoodsInfo(gift_id).then((res) => {
      res.code === 0 && setGoods(res.data);
    });
    getWxConfig(window.location.href.split("#")[0]).then((res) => {
      if (res.code === 0) {
        const { sign, noncestr, timestamp } = res.data;
        //????????????sdk
        wx.config({
          debug: false, // ??????????????????,??????????????? api ??????????????????????????? alert ???????????????????????????????????????????????? pc ????????????????????????????????? log ??????????????? pc ?????????????????????
          appId, // ?????????????????????????????????
          timestamp, // ?????????????????????????????????
          nonceStr: noncestr, // ?????????????????????????????????
          signature: sign, // ???????????????
          jsApiList: [
            "chooseWXPay",
            "openAddress",
            "onMenuShareAppMessage",
            "onMenuShareTimeline",
          ],
        });
        wx.ready(() => {
          playerRef.current.src(room.live_url);
          playerRef.current.play();
          playerRef2.current.src(room.live_url2);
          playerRef2.current.play();
          audioRef.current.play();
          const shareData = {
            title: "???????????????", // ????????????
            desc: "?????????????????????????????????????????????????????????????????????????????????????????????", // ????????????
            link: redirect_uri, // ?????????????????????????????????????????????????????????????????????????????? JS ??????????????????
            imgUrl: "", // ????????????
          };
          wx.onMenuShareAppMessage(shareData);
          wx.onMenuShareTimeline(shareData);
        });
      }
    });
    // }
    // });
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

  const initSocket = () => {
    wsRef.current = new WebSocket(ws);
    wsRef.current.onopen = () => {
      console.log("WebSocket????????????.");
      setShowReConnect(false);
      const msg = {
        cmd: "request_status",
        ...userInfoRef.current,
      };
      wsRef.current.send(JSON.stringify(msg));
      console.log("???????????????", msg);
    };
    wsRef.current.onclose = (event) => {
      console.log("WebSocket??????: ", event);
      const msg = {
        cmd: "exit_room",
        ...userInfoRef.current,
      };
      wsRef.current.send(JSON.stringify(msg));
      console.log("???????????????", msg);
      setShowReConnect(true);
    };
    wsRef.current.onerror = (event) => {
      console.log("WebSocket????????????: ", event);
      setShowReConnect(true);
    };
    wsRef.current.onmessage = (event) => {
      handleMsg(event.data);
    };
  };

  //??????????????????
  const reqRecords = () => {
    return getRecords(records_page.current).then((res) => {
      if (res.code === 0) {
        if (records_page.current === 1) {
          setRecords(res.data);
        } else {
          setRecords((val) => [...val, ...res.data]);
        }
        setHasMoreRecords(res.data.length > 0);
        if (res.data.length > 0) records_page.current += 1;
      }
    });
  };

  //????????????????????????
  const reqMyDealRecords = () => {
    return getMyDealRecords(myDealRecords_page.current).then((res) => {
      if (res.code === 0) {
        if (myDealRecords_page.current === 1) {
          setMyDealRecords(res.data);
        } else {
          setMyDealRecords((val) => [...val, ...res.data]);
        }
        setHasMoreMyDealRecords(res.data.length > 0);
        if (res.data.length > 0) myDealRecords_page.current += 1;
      }
    });
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;
    player.on("error", function (error) {
      setMachineState("ERROR");
      Toast.show({
        content: "????????????",
        maskClickable: false,
        duration: 1000,
      });
      console.log("player1:", error);
    });
  };
  const handlePlayerReady2 = (player) => {
    playerRef2.current = player;

    player.on("error", function (error) {
      setMachineState("ERROR");
      Toast.show({
        content: "????????????",
        maskClickable: false,
        duration: 1000,
      });
      console.log("player2:", error);
    });
  };

  const toggleCamera = () => {
    curSrcRef.current = curSrcRef.current === 1 ? 2 : 1;
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
    console.log("???????????????", msg);
    if (cmd === 4) {
      gameOver();
    }
  };

  const handleMsg = (msg) => {
    const data = JSON.parse(msg);
    const { timestamp } = data;
    const now = Date.now();
    if (timestamp) {
      let delay = now - timestamp;
      console.log("???????????????", data, now, delay);
      if (delay < 0) delay = Math.floor(Math.random() * 50);
      setDelay(delay);
      // if (delay > 200) {
      //   Toast.show({
      //     content: "??????????????????",
      //     maskClickable: false,
      //     duration: 1000,
      //   });
      // }
    }
    //????????????????????????
    if (data.cmd === "start_game") {
      const { ret } = data;
      if (ret === 1) {
        //??????????????????
        setGameState("INGAME");
        setShowGoods(false);
        setGameRes(null);
        // setTimeLeft(60);
        accountRef.current = accountRef.current - costRef.current;
        setAccount(accountRef.current);
        return;
      } else if (ret === -1) {
        //????????????
        Toast.show({
          content: "????????????,?????????",
          maskClickable: false,
          duration: 1000,
          afterClose: () => {
            gameReady();
            setShowPopup(true);
          },
        });
        return;
      } else if (ret === -2) {
        //????????????
        Toast.show({
          content: "????????????,???????????????",
          maskClickable: false,
          duration: 1000,
          afterClose: () => {
            gameReady();
          },
        });
        return;
      } else if (ret === -3) {
        //???????????????
        Toast.show({
          content: "?????????????????????????????????",
          maskClickable: false,
          duration: 1000,
          afterClose: () => {
            gameReady();
          },
        });
        return;
      }
    }
    //??????????????????
    if (data.cmd === "server_status") {
      const { status } = data;
      if (status === "busy") {
        setMachineState("BUSY");
        const { current_user } = data;
        setCurUser(current_user);
        const { uid, start_time } = current_user;
        // console.log(
        //   "???????????????",
        //   start_time,
        //   "???????????????",
        //   now,
        //   "???????????????",
        //   start_time + 60000 - now
        // );
        const tl = Math.round((start_time + 60000 - now) / 1000);
        if (uid === userInfoRef.current.uid && tl > 0) {
          //????????????
          setGameState("INGAME");
          setShowGoods(false);
          setTimeLeft(tl);
        }
        return;
      } else if (status === "leisure") {
        setMachineState("FREE");
        //??????????????????
        records_page.current = 1;
        reqRecords();
        return;
      } else if (status === "offline") {
        setMachineState("OFFLINE");
        Toast.show({
          content: "???????????????",
          maskClickable: false,
          duration: 1000,
        });
        return;
      } else if (status === "error") {
        setMachineState("ERROR");
        // const { desc } = data;
        Toast.show({
          content: "????????????",
          maskClickable: false,
          duration: 1000,
        });
        return;
      }
    }
    //????????????????????????
    if (data.cmd === "user_list") {
      setUsers({ count: data.count, list: data.user_list });
      return;
    }
    //??????????????????
    if (data.cmd === "game_ret") {
      setGameRes(data.ret === 0 ? "FAILED" : "SUCCESS");
      if (data.ret === 1) {
        curOrderIdRef.current = data.orderId;
        //????????????????????????
        myDealRecords_page.current = 1;
        reqMyDealRecords();
      }
      return;
    }
  };

  const gameStart = useCallback(
    _.throttle(
      (specId) => {
        curSpecGoodsIdRef.current = specId;
        Cookies.set("curSpecGoodsId", specId);
        const msg = {
          cmd: "start_game",
          specGoodsId: specId,
          ...userInfo,
        };
        if (wsRef.current && wsRef.current.readyState === 1)
          wsRef.current.send(JSON.stringify(msg));
        console.log("???????????????", msg);
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
    console.log("?????????????????????");
    if (account >= cost) {
      getAllSepcGoodsInfo(room.gift_id).then((res) => {
        res.code === 0 && setSpecGoods(res.data);
        setShowGoods(true);
      });
    } else {
      Toast.show({
        content: "????????????,?????????",
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
        grabReward(data).then((r) => {
          if (r.code === 0) {
            Toast.show({
              content: "????????????",
              maskClickable: false,
              duration: 1000,
            });
            //????????????????????????
            const newMyDealRecords = myDealRecords.map((item) =>
              item.order_id === orderId
                ? {
                    ...item,
                    addr_user: res.userName,
                    addr_phone: res.telNumber,
                    addr_province: res.provinceName,
                    addr_city: res.cityName,
                    addr_detail: res.detailInfo,
                    status: 1,
                  }
                : item
            );
            setMyDealRecords(newMyDealRecords);
          } else {
            Toast.show({
              content: `${r.code}:${r.error}`,
              maskClickable: false,
              duration: 1000,
            });
          }
        });
      },
    });
  };

  const wxpay = (specGoodsId, val) => {
    createOrder(specGoodsId, userInfoRef.current.openId).then((res) => {
      if (res.code === 0) {
        const {
          timeStamp,
          nonceStr,
          paySign,
          package: packageValue,
          signType,
        } = res.data;
        wx.chooseWXPay({
          timestamp: timeStamp, // ???????????????????????????????????? jssdk ?????????????????? timestamp ????????????????????????????????????????????????????????????????????? timeStamp ??????????????????????????? S ??????
          nonceStr: nonceStr, // ????????????????????????????????? 32 ???
          package: packageValue, // ???????????????????????????prepay_id??????????????????????????????prepay_id=\*\*\*???
          signType, // ????????????V3????????? RSA ,????????????V2??????????????????V2???????????????????????????????????????
          paySign, // ????????????
          success: () => {
            // ??????????????????????????????
            Toast.show({
              content: "????????????",
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
          <div style={{ display: curSrcRef.current === 1 ? "block" : "none" }}>
            <TCPlayer onReady={handlePlayerReady} id="player1" />
          </div>
          <div style={{ display: curSrcRef.current === 2 ? "block" : "none" }}>
            <TCPlayer onReady={handlePlayerReady2} id="player2" />
          </div>
          <div className=" absolute top-0 p-2 flex justify-start items-center bg-black bg-opacity-30 w-full">
            <span className=" text-sm text-white font-semibold mx-1">
              {users.count}???
            </span>
            {users.list.map((item, index) => (
              <Avatar
                key={index}
                src={item.avatar}
                style={{
                  "--size": "1.5rem",
                  borderRadius: "50%",
                  border: "1px solid #FFFFFF",
                  marginRight: "-0.375rem",
                }}
              />
            ))}
          </div>
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
                  {/* <img
                    onClick={selectGoods}
                    className="gameStartImg"
                    src={machineState === "FREE" ? start_game : waitting}
                    alt=""
                  /> */}
                  <div
                    onClick={selectGoods}
                    className="gameStartImg"
                    style={{
                      backgroundSize: "cover",
                      backgroundImage:
                        machineState === "FREE"
                          ? `url(${start_game})`
                          : `url(${waitting})`,
                    }}
                  ></div>
                  {machineState === "FREE" ? (
                    <span className=" absolute bottom-5 w-full text-center text-white font-semibold">
                      {cost}???/???
                    </span>
                  ) : machineState === "BUSY" ? (
                    <div className=" absolute top-0 bottom-0 left-0 right-0 p-7 text-white font-semibold flex justify-start items-center">
                      <Avatar
                        style={{
                          "--size": "3.25rem",
                          borderRadius: "50%",
                          border: "0.25rem solid #FFFFFF",
                          flexShrink: 0,
                        }}
                        src={curUser.avatar}
                      />
                      <div className=" flex flex-col items-start px-2">
                        <span>{name(curUser.nickname)}</span>
                        <span>?????????</span>
                      </div>
                    </div>
                  ) : (
                    <div className=" absolute top-0 bottom-0 left-0 right-0 p-7 text-white font-semibold flex justify-center items-center">
                      <span>
                        {machineState === "OFFLINE" ? "???????????????" : "????????????"}
                      </span>
                    </div>
                  )}
                </div>
              </CustomButton>
              <span className="font-semibold">ID???{userInfo.uid}</span>
            </div>

            <div className=" flex flex-col items-center">
              <CustomButton>
                {/* <img
                  onClick={() => setShowPopup(true)}
                  className="rechargeImg"
                  src={recharge}
                  alt=""
                /> */}
                <div
                  onClick={() => setShowPopup(true)}
                  className="rechargeImg"
                  style={{
                    backgroundSize: "cover",
                    backgroundImage: `url(${recharge})`,
                  }}
                ></div>
              </CustomButton>
              <span className="font-semibold">?????????{account}</span>
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
              "--title-font-size": "0.875rem",
              "--content-padding": 0,
            }}
            className=" font-semibold"
          >
            <Tabs.Tab title="????????????" key="goods">
              <img className=" w-full" src={instruction} alt="" />
            </Tabs.Tab>
            <Tabs.Tab title="????????????" key="records">
              <div className=" flex flex-col py-1">
                {records.map((item, index) => (
                  <div
                    key={index}
                    style={{ background: "#FFF6EF" }}
                    className=" flex justify-between items-center rounded-lg p-2 mx-4 my-1 text-sm"
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
              <InfiniteScroll loadMore={reqRecords} hasMore={hasMoreRecords} />
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
                  ????????????
                </Badge>
              }
              key="my_success_records"
            >
              <div className=" flex flex-col py-1">
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
                        style={{
                          "--size": "3.625rem",
                          borderRadius: "0.75rem",
                          flexShrink: 0,
                        }}
                        src={item.spec_img}
                      />
                      <div className=" flex flex-col justify-start flex-grow mx-2">
                        <span className=" text-black ">{item.goods_name}</span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            marginTop: "0.375rem",
                          }}
                        >
                          {item.create_time}
                        </span>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          color: item.status === 0 ? "#FF5C00" : "#6a6868",
                        }}
                      >
                        {item.status === 0
                          ? "????????????"
                          : item.status === 1
                          ? "?????????"
                          : "?????????"}
                      </span>
                    </div>
                    {item.status !== 0 ? (
                      <div
                        className=" flex justify-start items-center mt-3"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <EnvironmentOutline fontSize="1rem" />
                        <div className=" ml-3 flex flex-col justify-start">
                          <span>{item.addr_user + "  " + item.addr_phone}</span>
                          <span className=" font-normal">
                            {item.addr_province +
                              item.addr_city +
                              item.addr_detail}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {item.status === 2 ? (
                      <div
                        className=" flex justify-start items-center mt-2"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <TruckOutline fontSize="1rem" />
                        <div className=" ml-3  flex flex-col justify-start">
                          <div>
                            ???????????????
                            <span className=" font-normal">
                              {item.shipping_code}
                            </span>
                          </div>
                          <div>
                            ???????????????
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
              <InfiniteScroll
                loadMore={reqMyDealRecords}
                hasMore={hasMoreMyDealRecords}
              />
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
          width: "23.4375rem",
          left: "auto",
        }}
      >
        <div className="font-semibold p-3 flex justify-between bg-white">
          ??????????????????
          <CloseCircleFill
            onClick={() => {
              setShowPopup(false);
            }}
            fontSize="1.5rem"
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
                <img src={item.spec_img} width="60%" alt="" />
                <span
                  className=" w-full text-white text-center"
                  style={{
                    background: "#CB4D3D",
                    height: "1.625rem",
                  }}
                >
                  ?? {item.price}
                </span>
              </div>
            </CustomButton>
          ))}
        </div>
        <SafeArea position="bottom" />
      </Popup>
      <CenterPopup visible={showGoods}>
        <div className="overlayContainer">
          <div className="p-3 flex justify-between bg-white w-full font-semibold">
            ???????????????????????????
            <CloseCircleFill
              onClick={() => {
                setShowGoods(false);
              }}
              fontSize="1.5rem"
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
                style={{ width: "6.625rem" }}
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
              ???????????????????????????????????????
            </div>
            <div
              style={{
                gridTemplateColumns: "repeat(3,6rem)",
              }}
              className=" grid place-content-between gap-y-2 overflow-y-scroll w-full"
            >
              {specGoods.map((item, index) => (
                <CustomButton key={index} enable={item.store_count > 0}>
                  <div className=" flex flex-col items-center  font-semibold justify-start">
                    <div className=" relative rounded-xl overflow-hidden">
                      <img
                        className="rounded-xl"
                        src={item.spec_img}
                        alt=""
                        onClick={() => {
                          item.store_count > 0 && gameStart(item.item_id);
                        }}
                      />
                      {item.store_count <= 0 ? (
                        <div className=" absolute left-0 right-0 top-0 bottom-0 flex justify-center items-center text-xs text-white bg-black bg-opacity-30">
                          ????????????
                        </div>
                      ) : null}
                    </div>
                    <span
                      style={{
                        fontSize: "0.625rem",
                        lineHeight: 1.4,
                        color: item.store_count <= 0 ? "#B4B3B3" : "#6a6868",
                      }}
                    >
                      {item.spec[0]?.value}
                    </span>
                  </div>
                </CustomButton>
              ))}
            </div>
          </div>
        </div>
      </CenterPopup>
      <CenterPopup visible={gameRes}>
        {gameRes === "SUCCESS" ? (
          <div className="overlayDialog">
            <div className=" text-2xl">??????????????????</div>
            <div className=" flex justify-between w-full">
              <CustomButton>
                {/* <div className="dialogButton" onClick={() => route("address")}> */}
                <div
                  className="dialogButton"
                  onClick={() => {
                    openAddress(curOrderIdRef.current);
                  }}
                >
                  ????????????
                </div>
              </CustomButton>
              <CustomButton>
                <div
                  className="dialogButton right"
                  onClick={() => {
                    gameStart(curSpecGoodsIdRef.current);
                  }}
                >
                  ????????????
                </div>
              </CustomButton>
            </div>
          </div>
        ) : gameRes === "FAILED" ? (
          <div className="overlayDialog">
            <div className=" text-2xl">?????????????????????</div>
            <div className=" flex justify-between w-full">
              <CustomButton>
                <div className="dialogButton" onClick={gameReady}>
                  ????????????
                </div>
              </CustomButton>
              <CustomButton>
                <div
                  className="dialogButton right"
                  onClick={() => {
                    gameStart(curSpecGoodsIdRef.current);
                  }}
                >
                  ????????????
                </div>
              </CustomButton>
            </div>
          </div>
        ) : null}
      </CenterPopup>
      <CenterPopup visible={showReConnect}>
        {
          <div className="overlayDialog">
            <div className=" text-2xl">???????????????</div>
            <div className=" flex justify-center w-full">
              <CustomButton>
                <div className="dialogButton right" onClick={initSocket}>
                  ????????????
                </div>
              </CustomButton>
            </div>
          </div>
        }
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
