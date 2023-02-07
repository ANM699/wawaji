import React from "react";
export const TCPlayer = (props) => {
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const { onReady } = props;

  React.useEffect(() => {
    if (!playerRef.current) {
      const player = (playerRef.current = window.TCPlayer(
        "tc-player",
        {
          aspectRatio: "3:4",
          autoplay: "muted",
          muted: true,
          controls: false,
          responsive: true,
          preload: "auto",
          errorDisplay: true,
        },
        () => {
          console.log("player is ready");
          onReady && onReady(player);
        }
      ));
    }
  }, [videoRef]);

  return <video ref={videoRef} id="tc-player" playsInline></video>;
};

export default TCPlayer;
