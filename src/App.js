import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Main from "./containers/main";
import {
  authUrl_snsapi_userinfo,
  authUrl_snsapi_base,
  getSid,
  getRoomInfo,
} from "./api/index";
import CustomButton from "./components/custom-button";
import loading from "./assets/loading.gif";
const getUrlParams = (url) => {
  let queryString = url.split("?")[1];
  let obj = {};
  if (!queryString) return obj;
  let arr = queryString.split("&");
  for (let value of arr) {
    let index = value.indexOf("=");
    let paramName = value.slice(0, index);
    let paramValue = value.slice(index + 1);
    obj[paramName] = paramValue;
  }
  return obj;
};

const isDuringTime = (s, e) => {
  const curT = new Date();
  const day = curT.toLocaleDateString();
  const startT = new Date(day + " " + s);
  const endT = new Date(day + " " + e);
  return curT > startT && curT < endT;
};

function App() {
  //用户状态
  const [hasLogin, setHasLogin] = useState(false);
  const [room, setRoom] = useState({});
  const [isValid, setIsValid] = useState(true);
  useEffect(() => {
    const { code } = getUrlParams(window.location.search);
    const sid = Cookies.get("sid");
    getRoomInfo().then((res) => {
      if (res.code === 0) {
        setRoom(res.data);
        const isV =
          res.data.is_valid === "1" &&
          isDuringTime(res.data.start_time, res.data.end_time);
        setIsValid(isV);
        if (isV) {
          if (sid) {
            setHasLogin(true);
          } else if (code) {
            //有code说明已经同意授权
            getSid(code).then((res) => {
              if (res && res.user && res.sid) {
                const userInfo = {
                  uid: res.user.userId,
                  avatar: res.user.avatar,
                  nickname: res.user.nickname,
                };
                Cookies.set("userInfo", JSON.stringify(userInfo));
                Cookies.set("sid", res.sid, {
                  expires: new Date(new Date().getTime() + 12 * 60 * 60 * 1000),
                });
                setHasLogin(true);
              } else if (
                res.code === -1 &&
                res.msg.includes("code been used")
              ) {
                //code been used
                window.location.replace(authUrl_snsapi_base);
              }
            });
          } else {
            window.location.replace(authUrl_snsapi_base);
          }
        }
      }
    });
  }, []);

  return (
    <>
      {hasLogin ? (
        <Main room={room} />
      ) : (
        <div className="h-screen flex justify-center items-center bg-white">
          {isValid ? (
            <div className=" flex flex-col items-center">
              <img
                style={{ width: "9rem", marginBottom: "2rem" }}
                src={loading}
                alt=""
              />
              <CustomButton>
                <div
                  className="text-lg leading-none rounded-2xl p-4 text-white"
                  style={{ backgroundColor: "#dc744d" }}
                  onClick={() =>
                    window.location.replace(authUrl_snsapi_userinfo)
                  }
                >
                  开始游戏
                </div>
              </CustomButton>
            </div>
          ) : room.offline_img ? (
            <img
              style={{ width: "23.4375rem" }}
              src={room.offline_img}
              alt=""
            />
          ) : null}
        </div>
      )}
    </>
  );
}

export default App;
