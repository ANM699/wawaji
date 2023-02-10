import React, { useState } from "react";
import { List, SwipeAction, Form, Input, Cascader, Toast } from "antd-mobile";
import { EnvironmentOutline } from "antd-mobile-icons";
import CustomButton from "../components/custom-button";
import areaData from "../assets/area";
import "./address.css";
export default function Address({ route }) {
  const [mode, setMode] = useState("list");
  const [area, setArea] = useState([]);
  const [visible, setVisible] = useState(false);
  const rightActions = [
    {
      key: "default",
      text: "设为默认",
      color: "light",
      onClick: () => {},
    },
    {
      key: "delete",
      text: "删除",
      color: "danger",
      onClick: () => {},
    },
  ];
  const areaVal = area.map((item) => item.value);
  const areaStr = area.map((item) => item.label).join("");
  const items = ["A", "B", "C"];

  const onFinish = () => {
    setMode("list");
  };
  return mode === "list" ? (
    <>
      <List>
        {items.map((address, index) => (
          <SwipeAction key={index} rightActions={rightActions}>
            <List.Item arrow={false}>
              <div className="flex justify-between items-center text-sm">
                <EnvironmentOutline />
                <div
                  className=" flex flex-col items-start flex-grow mx-2"
                  onClick={() => route("main")}
                >
                  <span>季箭飞 13020293939</span>
                  <span className=" text-xs mt-1">上海市徐汇区宜山路757号</span>
                </div>
                <span
                  style={{ color: "#fa4f23" }}
                  onClick={() => setMode("edit")}
                >
                  编辑
                </span>
              </div>
            </List.Item>
          </SwipeAction>
        ))}
      </List>
      <div className=" fixed bottom-10 flex justify-evenly w-full">
        <CustomButton>
          <div className="backButton" onClick={() => route("main")}>
            返回
          </div>
        </CustomButton>
        <CustomButton>
          <div className="actionButton" onClick={() => setMode("edit")}>
            添加地址
          </div>
        </CustomButton>
      </div>
    </>
  ) : (
    <>
      <Form onFinish={onFinish}>
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: "姓名不能为空" }]}
        >
          <Input onChange={console.log} placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item
          name="cellphone"
          label="联系电话"
          rules={[{ required: true, message: "联系电话不能为空" }]}
        >
          <Input
            onChange={console.log}
            type="number"
            placeholder="请输入联系电话"
          />
        </Form.Item>
        <Form.Item
          name="area"
          label="地区"
          rules={[{ required: true, message: "地区不能为空" }]}
        >
          <div
            onClick={() => {
              setVisible(true);
            }}
          >
            <Input
              onChange={console.log}
              readOnly
              value={areaStr}
              placeholder="请选择所在地区"
            />
          </div>
        </Form.Item>
        <Form.Item
          name="desc"
          label="详细地址"
          rules={[{ required: true, message: "姓名不能为空" }]}
        >
          <Input onChange={console.log} placeholder="请输入详细地址" />
        </Form.Item>
      </Form>
      <Cascader
        options={areaData}
        visible={visible}
        // value={areaVal}
        onConfirm={(val, extend) => {
          if (extend.isLeaf) {
            setArea(extend.items);
            setVisible(false);
          } else {
            Toast.show({
              content: "请选择完整地区",
            });
          }
        }}
        onCancel={() => {
          setVisible(false);
        }}
      />
      <div className=" fixed bottom-10 flex justify-evenly w-full">
        <CustomButton>
          <div className="backButton" onClick={() => setMode("list")}>
            返回
          </div>
        </CustomButton>
        <CustomButton>
          <button className="actionButton" type="submit" onClick={onFinish}>
            保存
          </button>
        </CustomButton>
      </div>
    </>
  );
}
