import React, { Component, Fragment } from "react";
import GameBoard from "./gameboard";
import Controls from "./controls";
import Commands from "./commands";
import { CurrentInstruction, DragInfo, DragPosition, FunctionCommands, Level, StackElement } from "./baseTypes";

function replaceAt(string: string, index: number, replace: string): string {
  return string.substring(0, index) + replace + string.substring(index + 1);
}


// Step speed is a scale from 1-10, where 10 is the fastest (almost instant)
const INITIAL_SLIDER_SPEED = 3;
const BASE_SPEED = 6;


interface GameState extends Level {
  stack: StackElement[],
  stepDelay: number,
  clean: boolean,

  dragging: DragInfo | null,
  functions: FunctionCommands,
  currentInstruction: CurrentInstruction | null,
  hoveredCommand: { funcNum: string, position: number } | null,
  executionState: 'stopped' | 'running' | 'paused',
  executionHistory: GameState[],
}

interface GameProps {
  board: Level,
  setDragging: (isDragging: boolean) => void;
  onLevelComplete: () => void;
}


class Game extends Component<GameProps, GameState> {

  timeout: NodeJS.Timeout;

  constructor(props: GameProps) {
    super(props);
    this.state = {
      ...this.props.board,
      functions: {},
      stack: [],
      stepDelay: this.calculateStepDelay(INITIAL_SLIDER_SPEED + BASE_SPEED),
      clean: true,
      dragging: null,
      currentInstruction: null,
      hoveredCommand: null,
      executionState: 'stopped',
      executionHistory: [],
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    clearTimeout(this.timeout);
  }

  calculateStepDelay = (stepSpeed: number) => {
    return 1000 - (((stepSpeed) * 100) - 20);
  }

  reset = () => {
    clearTimeout(this.timeout);
    this.setState(state => ({
      ...this.props.board,
      clean: true,
      functions: state.functions,
      stack: [],
      currentInstruction: null,
      executionState: 'stopped',
      executionHistory: [],
    }));
  };

  commandMouseDown = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = evt.target as HTMLElement;
    const funcnum: string = target.dataset.funcnum;
    const index: number = parseInt(target.dataset.position, 10);

    const position = {
      x: evt.clientX - 15,
      y: evt.clientY - 15
    };
    this.setState(state => {
      // Check to see if there is a function there.
      if (state.functions[funcnum] && state.functions[funcnum][index]) {
        const { command, color } = state.functions[funcnum][index];
        this.props.setDragging(true);
        document.addEventListener("mousemove", this.mouseMove);
        document.addEventListener("mouseup", this.mouseUp);
        return {
          ...state,
          dragging: {
            position,
            command,
            color
          },
          functions: {
            ...state.functions,
            [funcnum]: state.functions[funcnum].map((f, i) => {
              if (i === index) return null;
              return f;
            })
          }
        };
      }
      return state;
    });
  };

  mouseDown = (position: DragPosition, command: string, color: string) => {
    this.props.setDragging(true);
    this.setState({
      dragging: {
        position: {
          x: position.x - 15,
          y: position.y - 15
        },
        command,
        color
      }
    });
    document.addEventListener("mousemove", this.mouseMove);
    document.addEventListener("mouseup", this.mouseUp);
  };

  mouseMove = (evt: MouseEvent) => {
    this.setState(state => ({
      dragging: {
        ...state.dragging,
        position: {
          x: state.dragging.position.x + evt.movementX,
          y: state.dragging.position.y + evt.movementY
        }
      }
    }));
  };

  mouseUp = (evt: MouseEvent) => {
    document.removeEventListener("mousemove", this.mouseMove);
    this.props.setDragging(false);
    document.removeEventListener("mouseup", this.mouseUp);

    const target = evt.target as HTMLElement;
    const funcKey: string = target.dataset.funcnum;
    const position = parseInt(target.dataset.position, 10);

    if (!funcKey) return this.setState({ dragging: null });
    let newAction = { function: funcKey, index: position }
    this.setState(state => {
      if (state.dragging.command) newAction["command"] = state.dragging.command;
      if (state.dragging.color) newAction["color"] = state.dragging.color;
      if (state.dragging.color === "clear") newAction["color"] = null;
      const func = state.functions[funcKey] || [];
      func[position] = { ...func[position], ...newAction };
      return {
        dragging: null,
        functions: { ...state.functions, [funcKey]: func }
      };
    });
  };

  handleCommandHover = (funcNum: string | null, position: number | null) => {
    if (funcNum === null || position === null) {
      this.setState({ hoveredCommand: null });
    } else {
      this.setState({ hoveredCommand: { funcNum, position } });
    }
  };

  handleKeyDown = (evt: KeyboardEvent) => {
    // Global shortcuts that don't depend on a hovered command
    switch (evt.key.toLowerCase()) {
      case ' ':
        evt.preventDefault();
        this.togglePause();
        return;
      case 'arrowleft':
        evt.preventDefault();
        this.stepBackward();
        return;
      case 'arrowright':
        evt.preventDefault();
        this.stepForward();
        return;
      case 'c':
        if (evt.shiftKey) {
          evt.preventDefault();
          this.clearAllFunctions();
        }
        return; // 'c' without shift does nothing and we shouldn't continue
      case 'r':
        if (evt.shiftKey) {
            evt.preventDefault();
            this.reset();
            return;
        }
        // Fallthrough for 'r' without shift to be handled by command block shortcuts
    }

    // Command block shortcuts - require a hovered command
    const { hoveredCommand } = this.state;
    if (!hoveredCommand) return;

    let command: string | null = null;
    let color: string | null = null;

    switch (evt.key.toLowerCase()) {
      case "w":
        command = "forward";
        break;
      case "a":
        command = "left";
        break;
      case "d":
        command = "right";
        break;
      case "r":
        color = "red";
        break;
      case "g":
        color = "green";
        break;
      case "b":
        color = "blue";
        break;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
        command = `f${parseInt(evt.key, 10) - 1}`;
        break;
      case "q":
      case "s": // Add 's' for default/gray color
        color = "clear";
        break;
      default:
        return; // Not a command block shortcut
    }

    evt.preventDefault(); // Prevent default action only for command block shortcuts

    this.setState(state => {
      const { funcNum, position } = hoveredCommand;
      const func = state.functions[funcNum] || [];
      const existingCommand = func[position] || { command: null, color: null };

      let newAction = {
        function: funcNum,
        index: position,
        command: existingCommand.command,
        color: existingCommand.color
      };

      if (command) {
        newAction.command = command;
      }

      if (color !== null) { // if a color-related key was pressed
        if (color === 'clear') {
            newAction.color = null; // sets to default/gray
        } else {
            newAction.color = color;
        }
      }
      
      func[position] = newAction;

      return {
        functions: { ...state.functions, [funcNum]: func }
      };
    });
  };

  clearAllFunctions = () => {
    this.setState({ functions: {} });
  };

  stepBackward = () => {
    if (this.state.executionHistory.length > 0) {
      this.setState(state => {
        const lastState = state.executionHistory[state.executionHistory.length - 1];
        return {
          ...lastState,
          executionHistory: state.executionHistory.slice(0, -1),
          executionState: 'paused',
        };
      });
    }
  };

  stepForward = () => {
    let { executionState, stack } = this.state;
    if (executionState === 'stopped' && (!stack || stack.length === 0)) {
       this.reset();
       const { functions } = this.state;
       const starting = functions.f0;
       stack = [].concat(starting);
       this.setState({ stack, clean: false, currentInstruction: { function: "f0", index: 0 }, executionState: 'paused' });
    } else {
        this.setState({ executionState: 'paused' });
    }

    this.runSingleStep();
  };


  togglePause = () => {
    const { executionState } = this.state;

    if (executionState === 'stopped') {
      this.start();
    } else if (executionState === 'running') {
      clearTimeout(this.timeout);
      this.setState({ executionState: 'paused' });
    } else if (executionState === 'paused') {
      this.setState({ executionState: 'running' });
      this.runStack();
    }
  };

  start = () => {
    this.reset();
    clearTimeout(this.timeout);
    // Start with F0 (aka "Main")
    const { functions } = this.state;
    const starting = functions.f0;
    const stack: StackElement[] = [].concat(starting);
    this.setState({ stack, clean: false, currentInstruction: { function: "f0", index: 0 }, executionState: 'running' });
    setTimeout(this.runStack, this.state.stepDelay);
  };

  runStack = () => {
    if (this.state.executionState !== 'running') {
      return;
    }
    this.runSingleStep(true);
  }

  runSingleStep = (isContinuousRun = false) => {
    this.setState(state => {
      if (state.stack.length === 0) {
        clearTimeout(this.timeout);
        return null; // No state update, this is safe.
      }

      // Record state for history *before* any changes in this step
      const clonedState = JSON.parse(JSON.stringify(state));
      delete clonedState.executionHistory;

      // Work with a copy of the stack to avoid direct state mutation
      const newStack = [...state.stack];
      const action = newStack.shift();

      const { Colors, RobotRow, RobotCol } = state;

      if (!action) {
        if (isContinuousRun) {
          this.runNow();
        }
        return {
          stack: newStack, // Use the new stack
          currentInstruction: null,
          executionHistory: [...state.executionHistory, clonedState], // Always return history
        };
      }

      const { command, color, index } = action;
      let boardColor = "#";
      if (RobotRow in Colors && 0 <= RobotCol && RobotCol < Colors[RobotRow].length) {
        boardColor = Colors[RobotRow][RobotCol];
      }

      if (
        !color ||
        (color === "red" && boardColor === "R") ||
        (color === "green" && boardColor === "G") ||
        (color === "blue" && boardColor === "B")
      ) {
        this.performAction(command);
        if (isContinuousRun) {
          this.timeout = setTimeout(this.runStack, this.state.stepDelay);
        }
        return {
          stack: newStack, // Use the new stack
          currentInstruction: { function: action.function, index: index },
          executionHistory: [...state.executionHistory, clonedState],
        };
      } else {
        if (isContinuousRun) {
          this.runNow();
        }
        return {
          stack: newStack, // Use the new stack
          currentInstruction: null,
          executionHistory: [...state.executionHistory, clonedState],
        };
      }
    });
  };

  runNow = () => {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(this.runStack, 0);
  };

  performAction = (action: string) => {
    this.setState(state => {
      const { Colors, RobotRow, RobotCol, RobotDir, functions, stack } = state;
      switch (action) {
        case "left":
          return {
            ...state,
            RobotDir: RobotDir - 1
          };
        case "right":
          return {
            ...state,
            RobotDir: RobotDir + 1
          };
        case "forward":
          switch (Math.abs(RobotDir + 400) % 4) {
            case 0:
              return {
                ...state,
                RobotCol: RobotCol + 1,
              };
            case 1:
              return {
                ...state,
                RobotRow: RobotRow + 1,
              };
            case 2:
              return {
                ...state,
                RobotCol: RobotCol - 1,
              };
            case 3:
              return {
                ...state,
                RobotRow: RobotRow - 1,
              };
            default:
              return state;
          }
        case "f0":
        case "f1":
        case "f2":
        case "f3":
        case "f4":
        case "f5":
          this.runNow();
          return {
            ...state,
            stack: functions[action].concat(stack),
            currentInstruction: null,
          };
        case "paint-red":
        case "paint-green":
        case "paint-blue":
          let color = action.split("-")[1];
          if (color === "red") color = "R";
          if (color === "green") color = "G";
          if (color === "blue") color = "B";
          return {
            ...state,
            Colors: Colors.map((row, i) => {
              if (i === RobotRow) {
                return replaceAt(row, RobotCol, color);
              }
              return row;
            })
          };
        default:
          return state;
      }
    }, this.checkGame);
  };

  checkGame = () => {
    const { Items, RobotCol, RobotRow } = this.state;
    if (!(RobotRow in Items) || RobotCol < 0 || Items[RobotRow].length <= RobotCol) {
      // Robot fell off board
      return setTimeout(this.reset, this.state.stepDelay);
    }

    if (Items[RobotRow][RobotCol] === "#") {
      // Robot went off path
      return setTimeout(this.reset, this.state.stepDelay);
    }
    if (Items[RobotRow][RobotCol] === "*") {
      return this.setState(
        state => ({
          Items: state.Items.map((row, i) => {
            if (i === RobotRow) {
              return replaceAt(row, RobotCol, "%");
            }
            return row;
          })
        }),
        this.checkGame
      );
    }
    // Clear a star if we are on it.
    const stars = Items.reduce(
      (prev, next) => prev + (next.match(/\*/g) || []).length,
      0
    );
    if (stars === 0) {
      clearTimeout(this.timeout);
      setTimeout(() => {
        window.alert(`You beat ${this.state.Title}!`);
        this.props.onLevelComplete();
      }, this.state.stepDelay);

    }
  };

  render() {
    const { dragging, functions, stepDelay, hoveredCommand } = this.state;
    return (
      <Fragment>
        <style>
          {`.gameboard {
--delay:${stepDelay}ms
}`}
        </style>
        <div className="gameboard-holder">
          <Fragment>
            <GameBoard {...this.state} />
            <div className="player-controls">
              <Controls
                {...this.state}
                dragging={dragging}
                functions={functions}
                onMouseDown={this.commandMouseDown}
                onCommandHover={this.handleCommandHover}
                hoveredCommand={hoveredCommand}
              />
              <Commands
                {...this.state}
                onMouseDown={this.mouseDown}
                dragging={dragging}
              />
              <div style={{ display: "flex" }}>
                <button onClick={this.stepBackward} disabled={this.state.executionHistory.length === 0} style={{ flex: 0.5 }}>
                  &lt;
                </button>
                <button onClick={this.togglePause} style={{ flex: 1 }}>
                  {this.state.executionState === 'running' ? 'Pause' : this.state.executionState === 'paused' ? 'Resume' : 'Go'}
                </button>
                <button onClick={this.stepForward} disabled={this.state.executionState === 'running'} style={{ flex: 0.5 }}>
                  &gt;
                </button>
              </div>
              <div style={{ display: "flex" }}>
                <button onClick={this.reset} style={{ flex: 1 }}>
                  Reset
                </button>
                <button onClick={this.clearAllFunctions} style={{ flex: 1 }}>
                  Clear All
                </button>
              </div>
              <div className="slider-container">
                <label htmlFor="speed">Slow</label>
                <input
                  className="speed-slider"
                  id="seed"
                  type="range"
                  min="1"
                  max="5"
                  defaultValue={INITIAL_SLIDER_SPEED}
                  onChange={evt => {
                    this.setState({
                      stepDelay: this.calculateStepDelay(parseInt(evt.target.value, 10) + BASE_SPEED),
                    });
                  }}
                />
                <label htmlFor="speed">Fast</label>
              </div>
              <div className="info-box">
                <h4>단축키 안내</h4>
                <ul>
                  <li><b>W, A, D:</b> 이동 (전진, 좌, 우)</li>
                  <li><b>R, G, B:</b> 색상 조건</li>
                  <li><b>Q, S:</b> 색상 조건 제거</li>
                  <li><b>1 - 6:</b> 함수 호출 (F0-F5)</li>
                  <li><b>Shift+C:</b> 모든 칸 초기화</li>
                  <li><b>Shift+R:</b> 로봇 위치 초기화</li>
                  <li><b>Space:</b> 실행 / 일시정지</li>
                  <li><b>← →:</b> 한 단계씩 실행</li>
                </ul>
                <p className="attribution">
                  This project is a fork of <a href="https://github.com/alexanderson1993/robozzle-react" target="_blank" rel="noopener noreferrer">alexanderson1993's Robozzle</a>.
                </p>
              </div>
            </div>
          </Fragment>
        </div>
        {dragging && (
          <div
            className="dragger"
            style={{
              transform: `translate(${dragging.position.x}px, ${dragging.position.y
                }px)`
            }}
          >
            <div
              className={`command ${dragging.command && dragging.command.indexOf("paint") > -1
                ? "paint"
                : ""
                } ${dragging.command} ${dragging.color ? `${dragging.color} color` : ""
                }`}
            />
          </div>
        )}
      </Fragment>
    );
  }
}

export default Game;
