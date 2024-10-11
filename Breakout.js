"use strict";

/* Constants */
const GWINDOW_WIDTH = 600;           
const GWINDOW_HEIGHT = 700;          
const N_ROWS = 10;                   
const N_COLS = 10;                   
const BRICK_ASPECT_RATIO = 4 / 1;    
const BRICK_TO_BALL_RATIO = 3 / 1;   
const BRICK_TO_PADDLE_RATIO = 2 / 3; 
const BRICK_SEP = 4;                 
const TOP_FRACTION = 0.1;            
const BOTTOM_FRACTION = 0.05;        
const N_BALLS = 3;                   
const TIME_STEP = 10;                
const INITIAL_Y_VELOCITY = 3.0;      
const MIN_X_VELOCITY = 5.0;          
const MAX_X_VELOCITY = 8.0; 
const MIN_X_VELOCITY_CENTER = 6.0;         

/* Derived constants */
const BRICK_WIDTH = (GWINDOW_WIDTH - (N_COLS + 1) * BRICK_SEP) / N_COLS;
const BRICK_HEIGHT = BRICK_WIDTH / BRICK_ASPECT_RATIO;
const PADDLE_WIDTH = BRICK_WIDTH / BRICK_TO_PADDLE_RATIO + 10;
const PADDLE_HEIGHT = BRICK_HEIGHT / BRICK_TO_PADDLE_RATIO - 5;
const PADDLE_Y = (1 - BOTTOM_FRACTION) * GWINDOW_HEIGHT - PADDLE_HEIGHT;
const BALL_SIZE = BRICK_WIDTH / BRICK_TO_BALL_RATIO;

/* Main program */

function Breakout() {
  let gw = GWindow(GWINDOW_WIDTH, GWINDOW_HEIGHT);
  drawBricks(gw);
  let paddle = drawPaddle(gw);
  let lives = 3;
  let points = 0; // track points for user to see but also for the code to know when to stop

  let vx = Math.random() * (MAX_X_VELOCITY - MIN_X_VELOCITY) + MIN_X_VELOCITY; 
  if (Math.random() < 0.5) vx = -vx; 
  let vy = INITIAL_Y_VELOCITY;

  let ball = drawBall(gw);
  let timer;
  let isRunning = false; // game doesn't run until the person clicks

  // a few GLabels to display lives, points, and some messages
  let livesLabel = new GLabel(`${lives} lives left`, 20, 30);
  livesLabel.setFont("SansSerif-bold-20");
  livesLabel.setColor('white');
  livesLabel.isLabel = true;
  gw.add(livesLabel);

  let pointsLabel = new GLabel(`${points} pts`, 525, 30);
  pointsLabel.setFont("SansSerif-bold-20");
  pointsLabel.setColor('white');
  pointsLabel.isLabel = true;
  gw.add(pointsLabel);

  let victoryLabel = new GLabel("Congratulations! You Win!", 150, 300);
  victoryLabel.setFont("SansSerif-bold-24");
  victoryLabel.setColor("green");

  let gameOverLabel = new GLabel("Game Over! Refresh the browser to try again", 50, 350);
  gameOverLabel.setFont("SansSerif-bold-24");
  gameOverLabel.setColor("red");  


  function resetBallAndPaddle() {
    // resets the ball position in the middle after losing a life
    ball.setLocation(GWINDOW_WIDTH / 2 - BALL_SIZE / 2, GWINDOW_HEIGHT / 2 - BALL_SIZE / 2);
    vx = Math.random() * (MAX_X_VELOCITY - MIN_X_VELOCITY) + MIN_X_VELOCITY;
    if (Math.random() < 0.5) vx = -vx;
    vy = INITIAL_Y_VELOCITY;
  }

  function updateLivesLabel() {
    livesLabel.setLabel(`${lives} lives left`);
    if (lives === 1) {
      livesLabel.setLabel(`${lives} life left`);
    }
  }

  function updatePointsLabel() {
    pointsLabel.setLabel(`${points} pts`);
  }

  gw.addEventListener("click", () => {
    if (!isRunning && lives > 0) { // only start if not already running and lives remain
        isRunning = true;
        timer = setInterval(() => {
            ball.move(vx, vy);

            // bounces the ball off the walls
            if (ball.getX() <= 0 || ball.getX() >= GWINDOW_WIDTH - BALL_SIZE) {
                vx = -vx;
            }

            if (ball.getY() <= 0) {
                vy = -vy;
            }

            // ball hits the bottom (lose a life)
            if (ball.getY() >= GWINDOW_HEIGHT - BALL_SIZE) {
                clearInterval(timer);
                lives--; //
                updateLivesLabel();

                if (lives === 0) {
                    gw.add(gameOverLabel);
                } else {
                    resetBallAndPaddle();
                }

                isRunning = false; // stops the game when the ball is lost
            }
            
            // makes sure ball doesn't get stuck on the sides
            if (ball.getX() <= 0) {
              vx = Math.abs(vx);
              ball.setLocation(1, ball.getY());
            } else if (ball.getX() >= GWINDOW_WIDTH - BALL_SIZE) {
              vx = -Math.abs(vx);
              ball.setLocation(GWINDOW_WIDTH - BALL_SIZE - 1, ball.getY());
            }

            let collider = getCollidingObject(gw, ball);
            if (collider) {
              if (collider === paddle) {
                  // Bounce off paddle
                  vy = -vy;
                  let paddleCenter = paddle.getX() + PADDLE_WIDTH / 2;
                  let ballCenter = ball.getX() + BALL_SIZE / 2;
                  let hitPosition = (ballCenter - paddleCenter) / (PADDLE_WIDTH / 2);
                  vx = hitPosition * MAX_X_VELOCITY; // change how fast it is based on hit position
          
                  if (Math.abs(vx) < MIN_X_VELOCITY) {
                      vx = vx < 0 ? -MIN_X_VELOCITY : MIN_X_VELOCITY;
                  }
                  let paddleBottom = paddle.getY();
                  ball.setLocation(ball.getX(), paddleBottom - BALL_SIZE); // prevent glitching through the paddle by moving the ball up a bit
          
              } else if (!collider.isLabel) {
                  vy = -vy;
                  gw.remove(collider); // removes the brick
                  points++;  // updates point total
                  updatePointsLabel();
          
                  // shows after the game is over (100 points)
                  if (points === 100) {
                      clearInterval(timer);
                      gw.add(victoryLabel);
                      isRunning = false;
                  }
              }
          }          
        }, TIME_STEP);
    }
});

  gw.addEventListener("mousemove", (event) => movePaddle(event, paddle));
}

// creates the 10 by 10 row of bricks
function drawBricks(gw) { 
  const colors = ["Red", "Orange", "Green", "Cyan", "Blue"];
  const firstColumnX = (GWINDOW_WIDTH - (N_COLS * BRICK_WIDTH + (N_COLS - 1) * BRICK_SEP)) / 2;

  for (let row = 0; row < N_ROWS; row += 2) {
      const colorIndex = Math.floor(row / 2) % colors.length;
      for (let col = 0; col < N_COLS; col++) {
          for (let r = 0; r < 2; r++) {
              if (row + r < N_ROWS) { 
                  let brick = GRect(
                      firstColumnX + col * (BRICK_WIDTH + BRICK_SEP),
                      (TOP_FRACTION * GWINDOW_HEIGHT) + (row + r) * (BRICK_HEIGHT + BRICK_SEP),
                      BRICK_WIDTH, BRICK_HEIGHT
                  );
                  brick.setColor(colors[colorIndex]);
                  brick.setFilled(true);
                  gw.add(brick);
              }
          }
      }
  }
}

function drawPaddle(gw) {
  let paddle = GRect((GWINDOW_WIDTH - PADDLE_WIDTH) / 2,  PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);
  paddle.setFilled(true);
  paddle.setColor('white');
  gw.add(paddle);
  return paddle;
}

// includes logic to move the paddle using mousemove event
function movePaddle(event, paddle) {
  let mouseX = event.getX();
  
  let paddleX = mouseX - PADDLE_WIDTH / 2;

  if (paddleX < 0) {
    paddleX = 0;
  }
  if (paddleX > GWINDOW_WIDTH - PADDLE_WIDTH) {
    paddleX = GWINDOW_WIDTH - PADDLE_WIDTH;
  }

  paddle.setLocation(paddleX, PADDLE_Y);
}

// just draws the ball
function drawBall(gw) {
  let ball = GOval((GWINDOW_WIDTH - BALL_SIZE) / 2, (GWINDOW_HEIGHT - BALL_SIZE) / 2, BALL_SIZE, BALL_SIZE);
  ball.setFilled(true);
  ball.setColor('white');
  gw.add(ball);
  return ball;
}

// checks what the ball collides to
function getCollidingObject(gw, ball) {
  const corners = [
    { x: ball.getX(), y: ball.getY() },
    { x: ball.getX() + BALL_SIZE, y: ball.getY() }, 
    { x: ball.getX(), y: ball.getY() + BALL_SIZE },
    { x: ball.getX() + BALL_SIZE, y: ball.getY() + BALL_SIZE }
  ];

  for (let corner of corners) {
    let collider = gw.getElementAt(corner.x, corner.y);
    if (collider !== null) {
      return collider;
    }
  }
  
  return null;
}
