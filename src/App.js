import { useState, useLayoutEffect } from "react";
import Cookies from "js-cookie";
import { Mask } from "antd-mobile";
import Main from "./containers/main";
import { authUrl, getSid } from "./api/index";

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

function App() {
  //用户状态
  const [hasLogin, setHasLogin] = useState(false);

  useLayoutEffect(() => {
    const { code } = getUrlParams(window.location.search);
    const sid = Cookies.get("sid");
    if (sid) {
      setHasLogin(true);
    } else if (!sid && code) {
      //有code说明已经同意授权
      getSid(code).then((res) => {
        const userInfo = {
          uid: res.user.userId,
          avatar: res.user.avatar,
          nickname: res.user.nickname,
        };
        Cookies.set("userInfo", JSON.stringify(userInfo));
        Cookies.set("sid", res.sid);
        setHasLogin(true);
      });
    }
  }, []);

  return (
    <>
      {hasLogin ? (
        <Main />
      ) : (
        <Mask visible opacity={0.8} disableBodyScroll={false}>
          <div
            onClick={() => window.location.replace(authUrl)}
            className=" w-screen h-screen text-white flex justify-center items-center"
            style={{ fontSize: "10rem" }}
          >
            图呢
          </div>
        </Mask>
      )}
    </>
  );
}

export default App;
