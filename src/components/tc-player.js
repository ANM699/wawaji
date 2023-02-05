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
          autoplay: true,
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
  React.useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return <video ref={videoRef} id="tc-player" playsInline></video>;
};

export default TCPlayer;
