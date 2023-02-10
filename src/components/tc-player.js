import React from "react";
export const TCPlayer = (props) => {
  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const { onReady, id } = props;

  React.useEffect(() => {
    if (!playerRef.current) {
      const player = (playerRef.current = window.TCPlayer(
        id,
        {
          controls: false,
          aspectRatio: "3:4",
          autoplay: true,
          muted: true,
          responsive: true,
          preload: "auto",
          errorDisplay: true,
        },
        () => {
          onReady && onReady(player);
        }
      ));
    }
  }, [videoRef]);

  return <video ref={videoRef} id={id} playsInline></video>;
};

export default TCPlayer;
