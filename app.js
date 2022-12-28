const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getQuery = `SELECT * FROM player_details;`;
  const dbResponse = await db.all(getQuery);
  let playersArray = [];
  for (let eachItem of dbResponse) {
    const result = convertPlayerObjectToResponseObject(eachItem);
    playersArray.push(result);
  }

  response.send(playersArray);
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const GetPlayerId = `
    SELECT * FROM player_details WHERE player_id =${playerId};`;
  const dbResponse = await db.get(GetPlayerId);
  const result = convertPlayerObjectToResponseObject(dbResponse);
  response.send(result);
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `
    UPDATE player_details 
    SET
    player_name='${playerName}'
    WHERE player_id=${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDerails = `
    SELECT * FROM match_details WHERE match_id=${matchId};`;
  const dbResponse = await db.all(getMatchDerails);
  let matchArray = [];
  for (let eachItem of dbResponse) {
    const result = convertMatchObjectToResponseObject(eachItem);
    matchArray.push(result);
  }
  response.send(matchArray[0]);
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `
    SELECT match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
    FROM match_details NATURAL JOIN player_match_score
    WHERE player_match_score.player_id=${playerId};`;
  const dbResponse = await db.all(getPlayerMatchDetails);
  response.send(dbResponse);
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchOfPlayer = `
    SELECT player_details.player_id AS playerId,
    player_details.player_name AS playerName
     FROM 
     (match_details INNER JOIN player_match_score ON 
        match_details.match_id=player_match_score.match_id)
     AS T INNER JOIN player_details ON T.player_id=player_match_score.player_id
    WHERE player_match_score.match_id=${matchId};`;
  const dbResponse = await db.all(getMatchOfPlayer);
  response.send(dbResponse);
});
//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStaticsQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours)AS totalFours,
    SUM(player_match_score.sixes)AS totalSixes
     FROM player_details INNER JOIN 
    player_match_score ON 
    player_details.player_id=player_match_score.player_id
    WHERE player_match_score.player_id=${playerId};`;
  const dbResponse = await db.all(getStaticsQuery);
  response.send(dbResponse);
});
