import React from "react";
import CustomButton from "./custom-button";
import up from "../assets/up.png";
import up_disable from "../assets/up_disable.png";
import down from "../assets/down.png";
import down_disable from "../assets/down_disable.png";
import left from "../assets/left.png";
import left_disable from "../assets/left_disable.png";
import right from "../assets/right.png";
import right_disable from "../assets/right_disable.png";
import grap from "../assets/grap.png";
import grap_disable from "../assets/grap_disable.png";
export default function CtrlPanel({ enable = true, handleCmd, timeLeft = 0 }) {
  return (
    <>
      <div className=" flex items-center">
        <CustomButton enable={enable}>
          <img
            onClick={() => {
              enable && handleCmd("LEFT");
            }}
            style={{ width: 70, height: 70 }}
            src={enable ? left : left_disable}
            alt=""
          />
        </CustomButton>
        <div className=" flex flex-col">
          <CustomButton enable={enable}>
            <img
              onClick={() => {
                enable && handleCmd("UP");
              }}
              style={{ width: 70, height: 70 }}
              src={enable ? up : up_disable}
              alt=""
            />
          </CustomButton>
          <CustomButton enable={enable}>
            <img
              onClick={() => {
                enable && handleCmd("DOWN");
              }}
              style={{ width: 70, height: 70 }}
              src={enable ? down : down_disable}
              alt=""
            />
          </CustomButton>
        </div>
        <CustomButton enable={enable}>
          <img
            onClick={() => {
              enable && handleCmd("RIGHT");
            }}
            style={{ width: 70, height: 70 }}
            src={enable ? right : right_disable}
            alt=""
          />
        </CustomButton>
      </div>
      <div>
        <CustomButton enable={enable}>
          <div
            className=" relative "
            onClick={() => {
              enable && handleCmd("GRAP");
            }}
          >
            <img
              style={{ width: 90, height: 90 }}
              src={enable ? grap : grap_disable}
              alt=""
            />
            {enable ? (
              <span className=" absolute bottom-3 w-full text-center text-white text-sm">
                {timeLeft}s
              </span>
            ) : null}
          </div>
        </CustomButton>
      </div>
    </>
  );
}
