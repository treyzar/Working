import styled, { css } from "styled-components";
import { createPortal } from "react-dom";
const Loader = ({ fullscreen = false }: { fullscreen?: boolean }) => {
  const content = (
    <StyledWrapper $fullscreen={fullscreen}>
      <div className="loadingspinner">
        <div id="square1" />
        <div id="square2" />
        <div id="square3" />
        <div id="square4" />
        <div id="square5" />
      </div>
    </StyledWrapper>
  );
  return fullscreen ? createPortal(content, document.body) : content;
};

const StyledWrapper = styled.div<{ $fullscreen: boolean }>`
  ${({ $fullscreen }) =>
    $fullscreen
      ? css`
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff; /* ← БЕЛЫЙ ФОН ВО ВЕСЬ ЭКРАН */
          /* backdrop-filter: blur(2px);  убираем при белом фоне */
          pointer-events: all;
          cursor: progress;
        `
      : css`
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        `}

  .loadingspinner {
    --square: 26px;
    --offset: 30px;
    --duration: 2.4s;
    --delay: 0.2s;
    --timing-function: ease-in-out;
    --in-duration: 0.4s;
    --in-delay: 0.1s;
    --in-timing-function: ease-out;

    width: calc(3 * var(--offset) + var(--square));
    height: calc(2 * var(--offset) + var(--square));
    position: relative;
    /* убираем внешние маргины, они не нужны на фулскрине */
    margin: 0;
    padding: 0;
  }

  .loadingspinner div {
    display: inline-block;
    background: darkorange;
    border: none;
    border-radius: 2px;
    width: var(--square);
    height: var(--square);
    position: absolute;
    padding: 0;
    margin: 0;
    font-size: 6pt;
    color: black;
  }
  .loadingspinner #square1 {
    left: calc(0 * var(--offset));
    top: calc(0 * var(--offset));
    animation: square1 var(--duration) var(--delay) var(--timing-function)
        infinite,
      squarefadein var(--in-duration) calc(1 * var(--in-delay))
        var(--in-timing-function) both;
  }

  .loadingspinner #square2 {
    left: calc(0 * var(--offset));
    top: calc(1 * var(--offset));
    animation: square2 var(--duration) var(--delay) var(--timing-function)
        infinite,
      squarefadein var(--in-duration) calc(1 * var(--in-delay))
        var(--in-timing-function) both;
  }

  .loadingspinner #square3 {
    left: calc(1 * var(--offset));
    top: calc(1 * var(--offset));
    animation: square3 var(--duration) var(--delay) var(--timing-function)
        infinite,
      squarefadein var(--in-duration) calc(2 * var(--in-delay))
        var(--in-timing-function) both;
  }

  .loadingspinner #square4 {
    left: calc(2 * var(--offset));
    top: calc(1 * var(--offset));
    animation: square4 var(--duration) var(--delay) var(--timing-function)
        infinite,
      squarefadein var(--in-duration) calc(3 * var(--in-delay))
        var(--in-timing-function) both;
  }

  .loadingspinner #square5 {
    left: calc(3 * var(--offset));
    top: calc(1 * var(--offset));
    animation: square5 var(--duration) var(--delay) var(--timing-function)
        infinite,
      squarefadein var(--in-duration) calc(4 * var(--in-delay))
        var(--in-timing-function) both;
  }

  @keyframes square1 {
    0% {
      left: calc(0 * var(--offset));
      top: calc(0 * var(--offset));
    }

    8.333% {
      left: calc(0 * var(--offset));
      top: calc(1 * var(--offset));
    }

    100% {
      left: calc(0 * var(--offset));
      top: calc(1 * var(--offset));
    }
  }

  @keyframes square2 {
    0% {
      left: calc(0 * var(--offset));
      top: calc(1 * var(--offset));
    }

    8.333% {
      left: calc(0 * var(--offset));
      top: calc(2 * var(--offset));
    }

    16.67% {
      left: calc(1 * var(--offset));
      top: calc(2 * var(--offset));
    }

    25.00% {
      left: calc(1 * var(--offset));
      top: calc(1 * var(--offset));
    }

    83.33% {
      left: calc(1 * var(--offset));
      top: calc(1 * var(--offset));
    }

    91.67% {
      left: calc(1 * var(--offset));
      top: calc(0 * var(--offset));
    }

    100% {
      left: calc(0 * var(--offset));
      top: calc(0 * var(--offset));
    }
  }

  @keyframes square3 {
    0%,
    100% {
      left: calc(1 * var(--offset));
      top: calc(1 * var(--offset));
    }

    16.67% {
      left: calc(1 * var(--offset));
      top: calc(1 * var(--offset));
    }

    25.00% {
      left: calc(1 * var(--offset));
      top: calc(0 * var(--offset));
    }

    33.33% {
      left: calc(2 * var(--offset));
      top: calc(0 * var(--offset));
    }

    41.67% {
      left: calc(2 * var(--offset));
      top: calc(1 * var(--offset));
    }

    66.67% {
      left: calc(2 * var(--offset));
      top: calc(1 * var(--offset));
    }

    75.00% {
      left: calc(2 * var(--offset));
      top: calc(2 * var(--offset));
    }

    83.33% {
      left: calc(1 * var(--offset));
      top: calc(2 * var(--offset));
    }

    91.67% {
      left: calc(1 * var(--offset));
      top: calc(1 * var(--offset));
    }
  }

  @keyframes square4 {
    0% {
      left: calc(2 * var(--offset));
      top: calc(1 * var(--offset));
    }

    33.33% {
      left: calc(2 * var(--offset));
      top: calc(1 * var(--offset));
    }

    41.67% {
      left: calc(2 * var(--offset));
      top: calc(2 * var(--offset));
    }

    50.00% {
      left: calc(3 * var(--offset));
      top: calc(2 * var(--offset));
    }

    58.33% {
      left: calc(3 * var(--offset));
      top: calc(1 * var(--offset));
    }

    100% {
      left: calc(3 * var(--offset));
      top: calc(1 * var(--offset));
    }
  }

  @keyframes square5 {
    0% {
      left: calc(3 * var(--offset));
      top: calc(1 * var(--offset));
    }

    50.00% {
      left: calc(3 * var(--offset));
      top: calc(1 * var(--offset));
    }

    58.33% {
      left: calc(3 * var(--offset));
      top: calc(0 * var(--offset));
    }

    66.67% {
      left: calc(2 * var(--offset));
      top: calc(0 * var(--offset));
    }

    75.00% {
      left: calc(2 * var(--offset));
      top: calc(1 * var(--offset));
    }

    100% {
      left: calc(2 * var(--offset));
      top: calc(1 * var(--offset));
    }
  }

  @keyframes squarefadein {
    0% {
      transform: scale(0.75);
      opacity: 0;
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

export default Loader;
