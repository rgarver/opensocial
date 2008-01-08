/**
 * Copyright 2007 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview This file implements a basic in memory container. The
 * state changes are written locally to member variables. In a real
 * world container, the state of the container would be stored typically
 * on a server (using ajax requests) so as to be perisstent across sessions.
 * This container serves two purposes.
 * (a) Demonstrate the concept of a container using a trivial example.
 * (b) Easily test gadgets with arbitrary initial state.
 */


/**
 * Implements the opensocial.Container apis.
 *
 * @param {Person} viewer Person object that corresponds to the viewer.
 * @param {Person} opt_owner Person object that corresponds to the owner.
 * @param {Collection&lt;Person&gt;} opt_viewerFriends A collection of the
 *    viewer's friends
 * @param {Collection&lt;Person&gt;} opt_ownerFriends A collection of the
 *    owner's friends
 * @param {Map&lt;String, String&gt;} opt_globalAppData map from key to value
 *    of the global app data
 * @param {Map&lt;String, String&gt;} opt_instanceAppData map from key to value
 *    of this gadget's instance data
 * @param {Map&lt;Person, Map&lt;String, String&gt;&gt;} opt_personAppData map
 *    from person to a map of app data key value pairs.
 * @param {Map&lt;String, Array&lt;Activity&gt;&gt;} opt_activities A map of
 *    person ids to the activities they have.
 * @constructor
 */
var rails = Class.create(opensocial.Container);
rails.Container = function(baseUrl, opt_owner, opt_viewer, opt_appId, opt_appTitle, opt_instanceId) {
  this._baseUrl = baseUrl;
  this.people = {
	'VIEWER': opt_viewer,
	'OWNER': opt_owner,
  };
  this.people[opt_owner.getId()] = opt_owner;
  this.people[opt_viewer.getId()] = opt_viewer;
  this.viewer = opt_viewer;
  this.owner = opt_owner;
  this.viewerFriends = {};
  this.ownerFriends = {};
  this.globalAppData = {};
  this.instanceAppData = {};
  this.personAppData = {};
  this.activities = {};
  this.appId = opt_appId;
  this.appTitle = opt_appTitle;
  this.instanceId = opt_instanceId;
};
rails.Container.inherits(opensocial.Container);


rails.Container.prototype.requestCreateActivity = function(activity,
    priority, opt_callback) {
  // Permissioning is not being handled in the mock container. All real
  // containers should check for user permission before posting activities.
  activity.setField(opensocial.Activity.Field.ID, 'postedActivityId');

  var userId = this.viewer.getId();
  var stream = activity.getField(opensocial.Activity.Field.STREAM);
  stream.setField(opensocial.Stream.Field.USER_ID, userId);
  stream.setField(opensocial.Stream.Field.APP_ID, this.appId);

  this.activities[userId] = this.activities[userId] || [];
  this.activities[userId].push(activity);

  if (opt_callback) {
    opt_callback();
  }
};


/**
 * Get a list of ids corresponding to a passed in idspec
 *
 * @private
 */
rails.Container.prototype.getIds = function(idSpec) {
  var ids = [];
  if (idSpec == opensocial.DataRequest.Group.VIEWER_FRIENDS) {
    var friends = this.viewerFriends.asArray();
    for (var i = 0; i < friends.length; i++) {
      ids.push(friends[i].getId());
    }
  } else if (idSpec == opensocial.DataRequest.Group.OWNER_FRIENDS) {
    var friends = this.ownerFriends.asArray();
    for (var i = 0; i < friends.length; i++) {
      ids.push(friends[i].getId());
    }
  } else if (idSpec == opensocial.DataRequest.PersonId.VIEWER) {
    ids.push(this.viewer.getId());
  } else if (idSpec == opensocial.DataRequest.PersonId.OWNER) {
    if (this.owner) {
      ids.push(this.owner.getId());
    }
  }

  return ids;
};


/**
 * This method returns the data requested about the viewer and his/her friends.
 * Since this is an in memory container, it is merely returning the member
 * variables. In a real world container, this would involve making an ajax
 * request to fetch the values from the server.
 *
 * To keep this simple (for now), the PeopleRequestFields values such as sort
 * order, filter, pagination, etc. specified in the DataRequest are ignored and
 * all requested data is returned in a single call back.
 *
 * @param {Object} dataRequest The object that specifies the data requested.
 * @param {Function} callback The callback method on completion.
 */
rails.Container.prototype.requestData = function(dataRequest,
    callback) {
  var requestObjects = dataRequest.getRequestObjects().clone();
  var dataResponseValues = {};
  var globalError = false;

	this._requestData(requestObjects, dataResponseValues, globalError, callback);
};
	
rails.Container.prototype._requestData = function(requestObjects, 
		dataResponseValues, globalError, callback) {

	if(requestObjects.length == 0) {
	  callback(new opensocial.DataResponse(dataResponseValues, globalError));
		return;
	}
	
	var requestObject = requestObjects.pop();
  var request = requestObject.request;
  var requestName = requestObject.key;

	switch (request.type) {
	  case 'FETCH_PERSON' :
	    var personId = request.id;
			this.fetchPerson(personId, requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
	    break;

	  case 'FETCH_PEOPLE' :
	    var idSpec = request.idSpec;
	    var persons = [this.owner];
	    if (idSpec == opensocial.DataRequest.Group.VIEWER_FRIENDS) {
	      this.fetchFriends('VIEWER', requestName, request, requestObjects, 
						dataResponseValues, globalError, callback);
	    } else if (idSpec == opensocial.DataRequest.Group.OWNER_FRIENDS) {
	      this.fetchFriends('OWNER', requestName, request, requestObjects, 
						dataResponseValues, globalError, callback);
	    } else {
	      if (!opensocial.Container.isArray(idSpec)) {
	        idSpec = [idSpec];
	      }
				this.fetchPeople(idSpec.clone(), requestName, request, requestObjects, 
						dataResponseValues, globalError, callback);
	    }
	    break;

	  case 'FETCH_GLOBAL_APP_DATA' :
	    var values = {};
	    var keys =  request.keys;

			this.fetchGlobalAppData(requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
	    break;

	  case 'FETCH_INSTANCE_APP_DATA' :
	    var keys =  request.keys;
			this.instanceAppData = this.fetchInstanceAppData(keys.clone(), requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
	    break;

	  case 'UPDATE_INSTANCE_APP_DATA' :
			this.createInstanceAppData(request.key, request.value, requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
	    break;

	  case 'FETCH_PERSON_APP_DATA' :
	    var ids = this.getIds(request.idSpec);
			this.fetchPersonAppData(ids.clone(), requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
	    break;

	  case 'UPDATE_PERSON_APP_DATA' :
	    var userId = request.id;
	    // Gadgets can only edit viewer data
	    if (userId == opensocial.DataRequest.PersonId.VIEWER
	        || userId == this.viewer.getId()) {
	      this.createPersonAppData(this.viewer.getId(), request.key, request.value, requestName, request, requestObjects, 
								dataResponseValues, globalError, callback);
	    } else {
	      this._requestData(requestObjects, dataResponseValues, true, callback);
	    }

	    break;

	  case 'FETCH_ACTIVITIES' :
	    var ids = this.getIds(request.idSpec);
			this.fetchActivitiesRequest(ids.clone(), requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
	    break;
	}
};


/**
 * Request a profile for the specified person id.
 * When processed, returns a Person object.
 *
 * @param {String} id The id of the person to fetch. Can also be standard
 *    person IDs of VIEWER and OWNER.
 * @param {Map&lt;opensocial.DataRequest.PeopleRequestFields, Object&gt;}
 *    opt_params Additional params to pass to the request. This request supports
 *    PROFILE_DETAILS.
 * @return {Object} a request object
 */
rails.Container.prototype.newFetchPersonRequest = function(id,
    opt_params) {
  return {'type' : 'FETCH_PERSON', 'id' : id};
};

rails.Container.prototype.fetchPerson = function(id, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	new Ajax.Request('/feeds/people/' + id.toString(), {
		method: 'get',
		asynchronous: true, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, container.processPerson(transport), false);
			container._requestData(requestObjects, dataResponseValues, globalError, callback);
		},
		onFailure: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, null, true);
			container._requestData(requestObjects, dataResponseValues, true, callback);
		}
	});
};

rails.Container.prototype.processPerson = function(transport) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
	
	var entry = xml.getElementsByTagName('entry')[0];
	var personHash = {
		'id': entry.getElementsByTagName('id')[0].textContent,
		'name': entry.getElementsByTagName('title')[0].textContent,
		'title': entry.getElementsByTagName('title')[0].textContent,
		'updated': entry.getElementsByTagName('updated')[0].textContent
	};
	return new opensocial.Person(personHash, false, false);
};


/**
 * Used to request friends from the server, optionally joined with app data
 * and activity stream data.
 * When processed, returns a Collection&lt;Person&gt; object.
 *
 * @param {Array&lt;String&gt; or String} idSpec An id, array of ids, or a group
 *    reference used to specify which people to fetch
 * @param {Map&lt;opensocial.DataRequest.PeopleRequestFields, Object&gt;}
 *    opt_params Additional params to pass to the request. This request supports
 *    PROFILE_DETAILS, SORT_ORDER, FILTER, FIRST, and MAX.
 * @return {Object} a request object
 */
rails.Container.prototype.newFetchPeopleRequest = function(idSpec,
    opt_params) {
  return {'type' : 'FETCH_PEOPLE', 'idSpec' : idSpec};
};

rails.Container.prototype.fetchPeople = function(ids, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	this._fetchPeople(ids.pop(), [], ids, requestName, request, requestObjects, dataResponseValues, globalError, callback);
};

rails.Container.prototype._fetchPeople = function(id, people, ids, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	if(id == null) {
		dataResponseValues[requestName] = new opensocial.ResponseItem(request, new opensocial.Collection(people), false);
		this._requestData(requestObjects, dataResponseValues, globalError, callback);
	} else {
		new Ajax.Request('/feeds/people/' + id.toString(), {
			method: 'get',
			asynchronous: true, // Need to change this to pipeline the process a bit
			onSuccess: function(transport) {
				var container = opensocial.Container.get();
				people.push(container.processPerson(transport));
				container._fetchPeople(ids.pop(), people, ids, requestName, request, requestObjects, dataResponseValues, globalError, callback);
			},
			onFailure: function(transport) {
				var container = opensocial.Container.get();
				container._fetchPeople(ids.pop(), people, ids, requestName, request, requestObjects, dataResponseValues, true, callback);
			}
		});
	}
};

rails.Container.prototype.fetchFriends = function(id, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	new Ajax.Request('/feeds/people/' + id.toString() + '/friends', {
		method: 'get',
		asynchronous: true, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, 
					new opensocial.Collection(container.processFriends(transport)), false);
			container._requestData(requestObjects, dataResponseValues, globalError, callback);
		},
		onFailure: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, null, true);
			container._requestData(requestObjects, dataResponseValues, true, callback);
		}
	});
};

rails.Container.prototype.processFriends = function(transport) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
	var raw_people = xml.getElementsByTagName('entry');
	
	var people = []
	for(var i=0; i < raw_people.length; i++){
		var personHash = {
			'id': raw_people[i].getElementsByTagName('id')[0].textContent,
			'name': raw_people[i].getElementsByTagName('title')[0].textContent,
			'title': raw_people[i].getElementsByTagName('title')[0].textContent,
			'updated': raw_people[i].getElementsByTagName('updated')[0].textContent
		};
		people.push(new opensocial.Person(personHash, false, false));
	}
	return people;
};


/**
 * Used to request global app data.
 * When processed, returns a Map&lt;String, String&gt; object.
 *
 * @param {Array&lt;String&gt;|String} keys The keys you want data for. This
 *     can be an array of key names, a single key name, or "*" to mean
 *     "all keys".
 * @return {Object} a request object
 */
rails.Container.prototype.newFetchGlobalAppDataRequest = function(
    keys) {
  return {'type' : 'FETCH_GLOBAL_APP_DATA', 'keys' : keys};
};

rails.Container.prototype.fetchGlobalAppData = function(requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/global', {
		method: 'get',
		asynchronous: true, // Need to change this to pipeline the process a bit
		onSuccess: function(transport){
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, container.processGlobalAppData(transport), false);
			container._requestData(requestObjects, dataResponseValues, globalError, callback);
		},
		onFailure: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, null, true);
			container._requestData(requestObjects, dataResponseValues, true, callback);
		}
	});
};

rails.Container.prototype.processGlobalAppData = function(transport) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
	
	var entries = xml.getElementsByTagName('entry');
	for(var j = 0; j < entries.length; j++) {
		this.globalAppData[entries[j].getElementsByTagName('title')[0].textContent] =
					entries[j].getElementsByTagName('content')[0].textContent;
	}
	return this.globalAppData;
};


/**
 * Used to request instance app data.
 * When processed, returns a Map&lt;String, String&gt; object.
 *
 * @param {Array&lt;String&gt;|String} keys The keys you want data for. This
 *     can be an array of key names, a single key name, or "*" to mean
 *     "all keys".
 * @return {Object} a request object
 */
rails.Container.prototype.newFetchInstanceAppDataRequest = function(
    keys) {
  return {'type' : 'FETCH_INSTANCE_APP_DATA', 'keys' : keys};
};

rails.Container.prototype.fetchInstanceAppData = function(keys, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/VIEWER/instance', {
		method: 'get',
		asynchronous: true, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, container.processInstanceAppData(transport), false);
			container._requestData(requestObjects, dataResponseValues, globalError, callback);
		},
		onFailure: function(transport) {
			var container = opensocial.Container.get();
			dataResponseValues[requestName] = new opensocial.ResponseItem(request, null, true);
			container._requestData(requestObjects, dataResponseValues, true, callback);
		}
	});
};

rails.Container.prototype.processInstanceAppData = function(transport) {
	var data = {};
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
	
	var entries = xml.getElementsByTagName('entry');
	for(var j = 0; j < entries.length; j++) {
		data[entries[j].getElementsByTagName('title')[0].textContent] =
					entries[j].getElementsByTagName('content')[0].textContent;
	}
	return data;
};


/**
 * Used to request an update of an app instance field from the server.
 * When processed, does not return any data.
 *
 * @param {String} key The name of the key
 * @param {String} value The value
 * @return {Object} a request object
 */
rails.Container.prototype.newUpdateInstanceAppDataRequest = function(
    key, value) {
  return {'type' : 'UPDATE_INSTANCE_APP_DATA', 'key' : key, 'value' : value};
};

rails.Container.prototype.createInstanceAppData = function(key, value, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	atom = '<entry xmlns="http://www.w3.org/2005/Atom"><title>' + key + '</title><content>' + value + '</content></entry>';
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/VIEWER/instance', {
		method: 'post',
		contentType: 'application/atom+xml',
		parameters: atom,
		asynchronous: true,
		onSuccess: function(transport) { 
			var container = opensocial.Container.get();
			container.processCreateInstanceAppData(transport); 
			// dataResponseValues[requestName] = container.processInstanceAppData(transport);
			container._requestData(requestObjects, dataResponseValues, globalError, callback);
		},
		onFailure: function(transport) {
			var container = opensocial.Container.get();
			container._requestData(requestObjects, dataResponseValues, true, callback);
		}
	});
};

rails.Container.prototype.processCreateInstanceAppData = function(transport) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
}


/**
 * Used to request app data for the given people.
 * When processed, returns a Map&lt;person id, Map&lt;String, String&gt;&gt;
 * object.
 *
 * @param {Array&lt;String&gt; or String} idSpec An id, array of ids, or a group
 *    reference. (Right now the supported keys are VIEWER, OWNER,
 *    OWNER_FRIENDS, or a single id within one of those groups)
 * @param {Array&lt;String&gt;|String} keys The keys you want data for. This
 *     can be an array of key names, a single key name, or "*" to mean
 *     "all keys".
 * @return {Object} a request object
 */
rails.Container.prototype.newFetchPersonAppDataRequest = function(
    idSpec, keys) {
  return {'type' : 'FETCH_PERSON_APP_DATA', 'idSpec' : idSpec, 'keys' : keys};
};

rails.Container.prototype.fetchPersonAppData = function(ids, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	this._fetchPersonAppData(ids.pop(), {}, ids, requestName, request, requestObjects, 
					dataResponseValues, globalError, callback);
};

rails.Container.prototype._fetchPersonAppData = function(id, personAppData, ids, requestName, 
		request, requestObjects, dataResponseValues, globalError, callback) {
  if(id == null) {
		dataResponseValues[requestName] = new opensocial.ResponseItem(request, personAppData, false);
		this._requestData(requestObjects, dataResponseValues, globalError, callback);
	} else {
		// ids can contain: VIEWER, OWNER, OWNER_FRIENDS, or a specific person id
		new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/' + id + '/shared', {
			method: 'get',
			asynchronous: true, // Need to change this to pipeline the process a bit
			onSuccess: function(transport) { 
				var container = opensocial.Container.get();
				personAppData[id] = container.processPersonAppData(transport); 
				container._fetchPersonAppData(ids.pop(), personAppData, ids, requestName, request, requestObjects, 
								dataResponseValues, globalError, callback);
			},
			onFailure: function(transport) {
				var container = opensocial.Container.get();
				container._fetchPersonAppData(ids.pop(), personAppData, ids, requestName, request, requestObjects, 
								dataResponseValues, true, callback);
			}
		});
	}
};

rails.Container.prototype.processPersonAppData = function(transport) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
	
	var entries = xml.getElementsByTagName('entry');
	var personAppData = {};
	for(var j = 0; j < entries.length; j++) {
 		personAppData[entries[j].getElementsByTagName('title')[0].textContent] =
					entries[j].getElementsByTagName('content')[0].textContent;
	}
	return personAppData;
};


/**
 * Used to request an update of an app field for the given person.
 * When processed, does not return any data.
 *
 * @param {String} id The id of the person to update. (Right now only the
 *    special VIEWER id is allowed.)
 * @param {String} key The name of the key
 * @param {String} value The value
 * @return {Object} a request object
 */
rails.Container.prototype.newUpdatePersonAppDataRequest = function(id,
    key, value) {
  return {'type' : 'UPDATE_PERSON_APP_DATA', 'id' : id, 'key' : key,
    'value' : value};
};

rails.Container.prototype.createPersonAppData = function(userId, key, value, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	// ids can contain: VIEWER, OWNER, OWNER_FRIENDS, or a specific person id
	atom = '<entry xmlns="http://www.w3.org/2005/Atom"><title>' + key + '</title><content>' + value + '</content></entry>';
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/' + userId + '/shared', {
		method: 'post',
		contentType: 'application/atom+xml',
		parameters: atom,
		asynchronous: true,
		onSuccess: function(transport) { 
			var container = opensocial.Container.get();
			container.processCreatePersonAppData(transport);
			container._requestData(requestObjects, dataResponseValues, globalError, callback);
		},
		onFailure: function(transport) {
			var container = opensocial.Container.get();
			container._requestData(requestObjects, dataResponseValues, true, callback);
		}
	});
};

rails.Container.prototype.processCreatePersonAppData = function(transport) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
};


/**
 * Used to request an activity stream from the server.
 * Note: Although both app and folder are optional, you can not just provide a
 * folder.
 * When processed, returns an object where "activities" is a
 * Collection&lt;Activity&gt; object and "requestedStream" is a Stream object
 * representing the stream you fetched. (Note: this may or may not be different
 * that the streams that each activity belongs to)
 *
 * @param {Array&lt;String&gt; or String} idSpec An id, array of ids, or a group
 *  reference to fetch activities for
 * @param {Map&lt;opensocial.DataRequest.ActivityRequestFields, Object&gt;}
 *    opt_params Additional params to pass to the request.
 * @return {Object} a request object
 */
rails.Container.prototype.newFetchActivitiesRequest = function(idSpec,
    opt_params) {
  return {'type' : 'FETCH_ACTIVITIES', 'idSpec' : idSpec};
};

rails.Container.prototype.fetchActivitiesRequest = function(ids, requestName, request, requestObjects, 
		dataResponseValues, globalError, callback) {
	this._fetchActivitiesRequest(ids.pop(), [], ids, requestName, request, requestObjects, 
			dataResponseValues, globalError, callback);
};

rails.Container.prototype._fetchActivitiesRequest = function(id, activities, ids, 
		requestName, request, requestObjects, dataResponseValues, globalError, callback) {
	if(id == null) {
		dataResponseValues[requestName] = new opensocial.ResponseItem(request, {
	    // Real containers should set the requested stream here
	    'requestedStream' : null,
	    'activities' : new opensocial.Collection(activities)
		}, false);
		this._requestData(requestObjects, dataResponseValues, globalError, callback);
	} else {
		new Ajax.Request('/feeds/activities/user/' + id, {
			method: 'get',
			asynchronous: true,
			onSuccess: function(transport) { 
				var container = opensocial.Container.get();
				container._fetchActivitiesRequest(ids.pop(), activities.concat(container.processActivitiesRequest(transport, id)), ids, requestName, request, requestObjects, 
						dataResponseValues, globalError, callback);
			},
			onFailure: function(transport) {
				var container = opensocial.Container.get();
				container._fetchActivitiesRequest(ids.pop(), activities, ids, requestName, request, requestObjects, 
						dataResponseValues, true, callback);
			}
		});
	}
};

rails.Container.prototype.processActivitiesRequest = function(transport, 
		id) {
	var parser = new DOMParser();
	var xml = parser.parseFromString(transport.responseText, 'text/xml');
	
	var raw_activities = xml.getElementsByTagName('entry');
	this.activities[id] = []
	for(var i=0; i < raw_activities.length; i++) {
		this.activities[id].push(new opensocial.newActivity(opensocial.newStream('Folder', 'Title'), raw_activities[i].getElementsByTagName('title')[0].textContent));
	}
	
	return this.activities[id];
};