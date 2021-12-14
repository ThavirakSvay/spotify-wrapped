const express = require("express");
const app = express();
const querystring = require("querystring");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 8888;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;
const stateKey = "spotify_auth_state";

app.use(express.static(path.resolve(__dirname, "/client/build")));

function generateRandomString(length) {
	var result = "";
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

app.get("/login", (req, res) => {
	const state = generateRandomString(16);
	res.cookie(stateKey, state);

	const scope = ["user-read-private", "user-read-email", "user-top-read"].join(" ");

	const queryParams = querystring.stringify({
		client_id: CLIENT_ID,
		response_type: "code",
		redirect_uri: REDIRECT_URI,
		state: state,
		scope: scope,
	});

	res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get("/callback", (req, res) => {
	const code = req.query.code || null;

	axios({
		method: "post",
		url: "https://accounts.spotify.com/api/token",
		data: querystring.stringify({
			grant_type: "authorization_code",
			code: code,
			redirect_uri: REDIRECT_URI,
		}),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
		},
	})
		.then((response) => {
			if (response.status === 200) {
				const { access_token, refresh_token, expires_in } = response.data;

				const queryParams = querystring.stringify({ access_token, refresh_token, expires_in });

				res.redirect(`${FRONTEND_URI}/?${queryParams}`);
			} else {
				res.redirect(`/?${querystring.stringify({ error: "invalid_token" })}`);
			}
		})
		.catch((error) => {
			res.send(error);
		});
});

if (process.env.NODE_ENV) {
	app.use(express.static(path.resolve(process.cwd(), "client/build")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(process.cwd(), "client/build/index.html"));
	});
}

app.listen(PORT, () => {
	console.log(`Running on port ${PORT}`);
});
