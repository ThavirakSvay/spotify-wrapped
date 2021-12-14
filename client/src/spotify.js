import axios from "axios";

const LOCALSTORAGE_KEYS = {
	accessToken: "spotify_access_token",
	refreshToken: "spotify_refresh_token",
	expireTime: "spotify_token_expire_time",
	timestamp: "spotify_token_timestamp",
};

const LOCALSTORAGE_VALUES = {
	accessToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.accessToken),
	refreshToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.refreshToken),
	expireTime: window.localStorage.getItem(LOCALSTORAGE_KEYS.expireTime),
	timestamp: window.localStorage.getItem(LOCALSTORAGE_KEYS.timestamp),
};

const hasTokenExpired = () => {
	const { accessToken, timestamp, expireTime } = LOCALSTORAGE_VALUES;
	if (!accessToken || !timestamp) {
		return false;
	}
	const millisecondsElapsed = Date.now() - Number(timestamp);
	return millisecondsElapsed / 1000 > Number(expireTime);
};

export const logout = () => {
	for (const property in LOCALSTORAGE_KEYS) {
		window.localStorage.removeItem(LOCALSTORAGE_KEYS[property]);
	}

	window.location = window.location.origin;
};

const refreshToken = async () => {
	try {
		//logout if there is no refresh token
		if (!LOCALSTORAGE_VALUES.refreshToken || LOCALSTORAGE_VALUES.refreshToken === "undefined" || (Date.now() - Number(LOCALSTORAGE_VALUES.timestamp)) / 1000 < 1000) {
			logout();
		}

		//requesting new token by refresh token
		const { data } = await axios.get(`/refresh_token?refresh_token=${LOCALSTORAGE_VALUES.refreshToken}`);
		window.localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, data.access_token);
		window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());

		window.location.reload();
	} catch (error) {
		console.error(error);
	}
};
const getAccessToken = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const queryParams = {
		[LOCALSTORAGE_KEYS.accessToken]: urlParams.get("access_token"),
		[LOCALSTORAGE_KEYS.refreshToken]: urlParams.get("refresh_token"),
		[LOCALSTORAGE_KEYS.expireTime]: urlParams.get("expires_in"),
	};
	const hasError = urlParams.get("error");

	// token expired
	if (hasError || hasTokenExpired() || LOCALSTORAGE_VALUES.accessToken === "undefined") {
		refreshToken();
	}

	// there is a valid token in localstorage
	if (LOCALSTORAGE_VALUES.accessToken && LOCALSTORAGE_VALUES.accessToken !== "undefined") {
		return LOCALSTORAGE_VALUES.accessToken;
	}

	//log in for the first time when there are query params
	if (queryParams[LOCALSTORAGE_KEYS.accessToken]) {
		for (const property in queryParams) {
			window.localStorage.setItem(property, queryParams[property]);
		}

		window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());

		return queryParams[LOCALSTORAGE_KEYS.accessToken];
	}
	return false;
};
export const accessToken = getAccessToken();

//axios global request headers
axios.defaults.baseURL = "https://api.spotify.com/v1";
axios.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
axios.defaults.headers["Content-Type"] = "application/json";

export const getCurrentUserProfile = () => axios.get("/me");

export const getCurrentUserPlaylists = (limit = 20) => {
	return axios.get(`/me/playlists?limit=${limit}`);
};

export const getTopArtists = (time_range = "medium_term") => {
	return axios.get(`/me/top/artists?time_range=${time_range}`);
};
export const getTopTracks = (time_range = "medium_term") => {
	return axios.get(`/me/top/tracks?time_range=${time_range}`);
};
export const getPlaylistById = (playlist_id) => {
	return axios.get(`/playlists/${playlist_id}`);
};
export const getAudioFeaturesForTracks = (ids) => {
	return axios.get(`/audio-features?ids=${ids}`);
};
