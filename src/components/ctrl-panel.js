import React from "react";
import CustomButton from "./custom-button";
import arrow from "../assets/arrow.png";
import arrow_disable from "../assets/arrow_disable.png";
import grap from "../assets/grap.png";
import grap_disable from "../assets/grap_disable.png";

const UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  GRAP = 4;

export default function CtrlPanel({ enable = true, handleCmd, timeLeft = 0 }) {
  return (
    <>
      <div className=" flex items-center">
        <CustomButton enable={enable}>
          {/* <img
            onClick={() => {
              enable && handleCmd(LEFT);
            }}
            style={{
              width: "4.375rem",
              height: "4.375rem",
              transform: "rotate(270deg)",
            }}
            src={enable ? arrow : arrow_disable}
            alt=""
          /> */}
          <div
            onClick={() => {
              enable && handleCmd(LEFT);
            }}
            style={{
              width: "4.375rem",
              height: "4.375rem",
              transform: "rotate(270deg)",
              backgroundSize: "cover",
              backgroundImage: enable
                ? `url(${arrow})`
                : `url(${arrow_disable})`,
            }}
          ></div>
        </CustomButton>
        <div className=" flex flex-col">
          <CustomButton enable={enable}>
            {/* <img
              onClick={() => {
                enable && handleCmd(DOWN);
              }}
              style={{ width: "4.375rem", height: "4.375rem" }}
              src={enable ? arrow : arrow_disable}
              alt=""
            /> */}
            <div
              onClick={() => {
                enable && handleCmd(DOWN);
              }}
              style={{
                width: "4.375rem",
                height: "4.375rem",
                backgroundSize: "cover",
                backgroundImage: enable
                  ? `url(${arrow})`
                  : `url(${arrow_disable})`,
              }}
            ></div>
          </CustomButton>
          <CustomButton enable={enable}>
            {/* <img
              onClick={() => {
                enable && handleCmd(UP);
              }}
              style={{
                width: "4.375rem",
                height: "4.375rem",
                transform: "rotate(180deg)",
              }}
              src={enable ? arrow : arrow_disable}
              alt=""
            /> */}
            <div
              onClick={() => {
                enable && handleCmd(UP);
              }}
              style={{
                width: "4.375rem",
                height: "4.375rem",
                transform: "rotate(180deg)",
                backgroundSize: "cover",
                backgroundImage: enable
                  ? `url(${arrow})`
                  : `url(${arrow_disable})`,
              }}
            ></div>
          </CustomButton>
        </div>
        <CustomButton enable={enable}>
          {/* <img
            onClick={() => {
              enable && handleCmd(RIGHT);
            }}
            style={{
              width: "4.375rem",
              height: "4.375rem",
              transform: "rotate(90deg)",
            }}
            src={enable ? arrow : arrow_disable}
            alt=""
          /> */}
          <div
            onClick={() => {
              enable && handleCmd(RIGHT);
            }}
            style={{
              width: "4.375rem",
              height: "4.375rem",
              transform: "rotate(90deg)",
              backgroundSize: "cover",
              backgroundImage: enable
                ? `url(${arrow})`
                : `url(${arrow_disable})`,
            }}
          ></div>
        </CustomButton>
      </div>
      <div>
        <CustomButton enable={enable}>
          <div
            className=" relative "
            onClick={() => {
              enable && handleCmd(GRAP);
            }}
          >
            {/* <img
              style={{ width: "5.625rem", height: "5.625rem" }}
              src={enable ? grap : grap_disable}
              alt=""
            /> */}
            <div
              style={{
                width: "5.625rem",
                height: "5.625rem",
                backgroundSize: "cover",
                backgroundImage: enable
                  ? `url(${grap})`
                  : `url(${grap_disable})`,
              }}
            ></div>
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
