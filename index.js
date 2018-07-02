
const FIFA_FIXTURES_URL = "https://fifa-2018-apis.herokuapp.com/fifa/fixtures";
const FOOTBALL_DATA_TEAMS_URL = 'https://api.football-data.org/v1/competitions/467/teams';
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
let groupStageFixtures = [];
let knockoutFixtures = [];
let country = '';
let roster = [];
let history = {};
let allResults = [];
const teams = {
	groupA: ["Russia", "Saudi Arabia", "Egypt", "Uruguay"],
	groupB: ["Portugal", "Spain", "Morocco", "Iran"],
	groupC: ["France", "Australia", "Peru", "Denmark"],
	groupD: ["Argentina", "Iceland", "Croatia", "Nigeria"],
	groupE: ["Brazil", "Switzerland", "Costa Rica", "Serbia"],
	groupF: ["Germany", "Mexico", "Sweden", "Korea Republic"],
	groupG: ["Belgium", "England", "Tunisia", "Panama"],
	groupH: ["Poland", "Senegal", "Colombia", "Japan"],
}

//retrieve FIFA fixture data and build groupStageFixtures array

		function buildFixturesArr() {
			getFixturesApiData(callbackFixtureData);	
		}


		function getFixturesApiData(callback) {
		  	$.getJSON(FIFA_FIXTURES_URL, callback);
		}

		function callbackFixtureData(data) {
			groupStageFixtures = assignFixtures(data.data.group_stages);

			getAllResultsApiData(groupStageFixtures);
		}

		function assignFixtures(data) {
		  	const fixtures = data;
		  	return createFixtures(fixtures) 	
		}

		function createFixtures(fixtures) {
			console.log(fixtures);
			const allFixtures = Object.keys(fixtures).reduce((acc, date) => {
		    	const matches = fixtures[date].reduce((acc2, match) => {
		    		const fixtureUnix = Date.parse(match.datetime);
		      		if (fixtureUnix < Date.now()) {
		        		acc2.push(match);
		        	}
		    		return acc2;
		    	}, [])
		    	return [...acc, ...matches];
		    }, []);
		  for (let i = 0; i < allFixtures.length; i++) {
		  	const apiUrl = createMatchResultsApiUrl(allFixtures[i].link);
		  	allFixtures[i].link = apiUrl;
		  }
		  	return allFixtures;
		}

		function createMatchResultsApiUrl(link) {
			return "https://fifa-2018-apis.herokuapp.com/fifa/live" + link;
		}

		function getAllResultsApiData(groupStageFixtures) {
			groupStageFixtures.forEach(function(match, i) {
		  		getResultsApiData(match.link, callbackResultsData, groupStageFixtures, i)
		  	})
		
		}

		function fixturesArrayIsReady() {
			fixIran();
		  	enableCountrySelectionSubmit();
		  	console.log(knockoutFixtures);
		}

		function enableCountrySelectionSubmit(){
			console.log("enabled ran")
			$('#country-submit').removeAttr("disabled").attr({value: "Submit Country"});
		}

		function getResultsApiData(apiUrl, callbackFunc, fixturesArr, index) {
			$.ajax({
		  url: apiUrl,
		  dataType: 'json',
		  type: 'GET',
		}).done(function(response) {
			if (index === groupStageFixtures.length - 1) {		 	
				fixturesArrayIsReady();
			}
		 	callbackFunc(response, fixturesArr, index);
		})
		}

		function callbackResultsData(data, fixturesArr, index) {
			fixturesArr[index].results = data.data;
		}

		function fixIran() {
			groupStageFixtures.forEach(function (fixture) {
				if (fixture.home_team === "IR Iran") {
					fixture.home_team = "Iran";
				}
				if (fixture.away_team === "IR Iran") {
					fixture.away_team = "Iran";
				}
			})
		}

//create country list and render country options in select tag
	function generateSelectCountryOptions(teams) {
		const countries = Object.keys(teams).reduce((acc, key) => {
			return [...acc, ...teams[key]];
		}, 	[])		
		return countries.sort();
	}

	function renderSelectCountryOptions() {
		const allTeams = generateSelectCountryOptions(teams);
		const options = allTeams.map(team => {
			return `<option value='${team}'> ${team} </option>`;
		})
		$('#countries').html(options);
	}

//assign country variable
	function assignCountryVar(countrySelection) {
		country = countrySelection;
	}

//retrieve roster from football data and build roster array
	function getRosterArray(country) {
		getFootballDataApiData(FOOTBALL_DATA_TEAMS_URL, callbackFootballDataApiData, country);
	}

	function getFootballDataApiData(apiUrl, callbackFunc, country) {
		$.ajax({
  			headers: { 
  				'X-Auth-Token': 'f7302355bfde4075a668246ec2d7056e'
	},
  			url: apiUrl,
  			dataType: 'json',
  			type: 'GET',
		}).done(function(response) {
 			callbackFunc(response, country);
		});
	}

	function callbackFootballDataApiData(response, country) {
		const teams = response.teams;
  		const FOOTBALL_DATA_PLAYERS_URL = teams.reduce((acc, team) => {
  			if (team.name === country) {
  				const href = team._links.players.href;
  				acc = href.substring(0, 4) + "s" + href.substring(4);
  			}
  			console.log(acc);
  			return acc;
  		}, "");
  		getFootballDataApiData(FOOTBALL_DATA_PLAYERS_URL, callbackFootballDataApiPlayerData);
	}

	function callbackFootballDataApiPlayerData(response, country){
		updateRosterArray(response);
		displayRoster();	}

	function updateRosterArray(response) {
		roster = buildRosterArray(response);
		console.log(roster);
	}

	function buildRosterArray(response) {
		const players = response.players;
		return players.sort(function(a, b) {
			if (a.jerseyNumber < b.jerseyNumber) {
    			return -1;
  			} else if (a.jerseyNumber > b.jerseyNumber) {
    			return 1;
  			}
  			return 0;
		});
	}

//retrieve wikipedia data and places in variable
	function getHistoryInfo(country){
		getWikipediaApiData(country);
	}

	function getWikipediaApiData(country) {
		console.log('getWikipediaApiData has ran');
		const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=${country}_national_football_team&callback=?`;
	    $.ajax({
	        type: "GET",
	        url: apiUrl,
	        contentType: "application/json; charset=utf-8",
	        async: false,
	        dataType: "json",
	        success: function (data, textStatus, jqXHR) {
	            buildHistoryString(data);
	            displayTeamHistory(history);
	        },
	        error: function (errorMessage) {
	        }
	    });
	}

	function buildHistoryString(data) {
		history = data;
	}

//display flag
	function displayFlag(country) {
		const url = getFlagUrl(country);
		renderFlag(url, country);
	}

	function getFlagUrl(country) {
		return groupStageFixtures.reduce((acc, fixture) => {
			if (fixture.home_team === country) {
				acc = fixture.home_flag;
			}
			if (fixture.away_team === country) {
				acc = fixture.away_flag;
			}
			return acc;
		})
	}

	function renderFlag(url, country){
		$('.js-flag').attr({
			src: url,
			alt: `${country}'s flag`,
		})
	}

//displays country name
	
	function displayCountryName(country) {
	$('.js-country-name').html(country.toUpperCase());
	}

//retrieves results data from groupStageFixtures array
	function displayResults(country) {
		const results = getCountryFixturesData(country);
		//const latestResult = generateHtmlLatestResult(results);
		$('.js-timeline p').html(results);

	}

	function getCountryFixturesData(country) {
		let fixtureCount = 0;
		console.log(groupStageFixtures);
		return groupStageFixtures.reduce((acc, fixture) => {		
			if (fixture.home_team === country || fixture.away_team === country) {
				fixtureCount++;
				console.log(fixture, fixtureCount);
				const htmlResults = generateHtmlResults(fixture);
				acc.unshift(htmlResults);
			}
			return acc;
		}, [])
	}

	function getDateTime(match){
		return match.datetime;
	}

	function getHomeTeam(match) {
		return match.home_team;
	}

	function getAwayTeam(match) {
		return match.away_team;
	}

	function getScore(match) {
		return match.results.score;
	}

	function getHomeScorers(match) {
		return match.results.home_scoreres;
	}

	function getAwayScorers(match) {
		return match.results.away_scoreres;
	}

//generates HTML for results
	function generateHtmlResults(match) {
		return `<div>${getDateTime(match)}</div>
			<span>${getHomeTeam(match)}</span> <span>${getScore(match)}</span> <span>${getAwayTeam(match)}</span>
			<div class="row js-scorers">
			<div class="col-6 js-home-scorers">
				<ul>
					${generateHtmlHomeScorers(match)}
				</ul>
			</div>
			<div class="col-6 js-away-scorers">
				<ul>
					${generateHtmlAwayScorers(match)}
				</ul>
			</div>
			</div>`
		};

	function generateHtmlHomeScorers(match) {
		const homeScorers = getHomeScorers(match);
		const scorers = homeScorers.map(scorer => {
			return `<li>
					${scorer.title} ${scorer.minute}
					</li>`
		})
		return scorers.join(" ");
	}

	function generateHtmlAwayScorers(match) {
		const awayScorers = getAwayScorers(match);
		const scorers = awayScorers.map(scorer => {
			return `<li>
					${scorer.minute} ${scorer.title}
					</li>`
		})
		return scorers.join(" ");
	}


//renders roster
	function renderRoster() {
		return roster.map(player => {
			return `<li>${player.position} ${player.name}</li>`
		})
		console.log(roster);
	}

	function displayRoster() {
		playerRoster = renderRoster(roster);
		$('.js-roster ul').html(playerRoster);
	}

//renders history

	function displayTeamHistory(data) {
   	var markup = data.parse.text["*"];
   	var blurb = $('<div class="js-wiki"></div>').html(markup); 
   	console.log(blurb);
   	$('.js-history p').html($(blurb).find('p'));
   	$( "a[href^='/']" ).prop( "href", function( _idx, oldHref ) {
   		const href = oldHref.split('/');
   		return "https://en.wikipedia.org/wiki/" + href[href.length - 1];
  		});
	}

//display class (remove "inactive" class)
function removeInactiveClass(className) {
	$(`.${className}`).removeClass("inactive");
}	

//function that handles submit country event
	function handleCountrySelection(event) {
		event.preventDefault();
		const country = $('#countries option:selected').val();
		displayFlag(country);
		displayCountryName(country);
		getRosterArray(country);
		getHistoryInfo(country);

		displayResults(country);
		removeInactiveClass("js-country-profile");


	}

function startWorldCupApp() {
	buildFixturesArr();
	renderSelectCountryOptions();
}

$(startWorldCupApp());