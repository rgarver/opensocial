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

Document.prototype.$TAG = function(tag){return this.getElementsByTagName(tag);}
Element.prototype.$TAG = function(tag){return this.getElementsByTagName(tag);}	

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
opensocial.RailsContainer = function(baseUrl, opt_owner, opt_viewer, opt_appId, opt_instanceId) {
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
  this.instanceId = opt_instanceId;
};
opensocial.RailsContainer.inherits(opensocial.Container);


opensocial.RailsContainer.prototype.requestCreateActivity = function(activity,
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
opensocial.RailsContainer.prototype.getIds = function(idSpec) {
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
opensocial.RailsContainer.prototype.requestData = function(dataRequest,
    callback) {
  var requestObjects = dataRequest.getRequestObjects();
  var dataResponseValues = {};
  var globalError = false;

  for (var requestNum = 0; requestNum < requestObjects.length; requestNum++) {
    var request = requestObjects[requestNum].request;
    var requestName = requestObjects[requestNum].key;
    var requestedValue;
    var hadError = false;

    switch (request.type) {
      case 'FETCH_PERSON' :
        var personId = request.id;
		if (this.people[personId]) {
			requestedValue = this.people[personId];
		} else {
			// Request from server
			requestedValue = this.fetchPerson(personId)
			
			// And then append to the people hash
			this.people[personId] = requestedValue;
		}
        break;

      case 'FETCH_PEOPLE' :
        var idSpec = request.idSpec;
        var persons = [this.owner];
        if (idSpec == opensocial.DataRequest.Group.VIEWER_FRIENDS) {
          persons = this.fetchFriends('VIEWER');
        } else if (idSpec == opensocial.DataRequest.Group.OWNER_FRIENDS) {
          persons = this.fetchFriends('OWNER');
        } else {
          if (!opensocial.Container.isArray(idSpec)) {
            idSpec = [idSpec];
          }
          for (var i = 0; i < idSpec.length; i++) {
			if(this.people[idSpec[i]]) {
				persons.push(this.people[idSpec[i]]);
			} else {
				var person = this.fetchPerson(idSpec[i]);
			
	            if (person != null) {
				  this.people[idSpec[i]] = person;
	              persons.push(person);
	            }
			}
          }
        }
		
        requestedValue = new opensocial.Collection(persons);
        break;

      case 'FETCH_GLOBAL_APP_DATA' :
        var values = {};
        var keys =  request.keys;

		this.fetchGlobalAppData();
        for (var i = 0; i < keys.length; i++) {
          values[keys[i]] = this.globalAppData[keys[i]];
        }
        requestedValue = values;
        break;

      case 'FETCH_INSTANCE_APP_DATA' :
        var keys =  request.keys;
		this.instanceAppData = this.fetchInstanceAppData(keys[i]);
        requestedValue = this.instanceAppData;
        break;

      case 'UPDATE_INSTANCE_APP_DATA' :
		alert('UPDATE_INSTANCE_APP_DATA not fully supported');
        this.instanceAppData[request.key] = request.value;
        break;

      case 'FETCH_PERSON_APP_DATA' :
        var ids = this.getIds(request.idSpec);

		if (!this.personAppData[personId]) {
	        this.fetchPersonAppData(ids);
		}
        requestedValue = this.personAppData;
        break;

      case 'UPDATE_PERSON_APP_DATA' :
        var userId = request.id;
		
        // Gadgets can only edit viewer data
        if (userId == opensocial.DataRequest.PersonId.VIEWER
            || userId == this.viewer.getId()) {
          this.createPersonAppData(this.viewer.getId(), request.key, request.value);
        } else {
          hadError = true;
        }

        break;

      case 'FETCH_ACTIVITIES' :
		alert('FETCH_ACTIVITIES not fully supported');
        var ids = this.getIds(request.idSpec);

        var requestedActivities = [];
        for (var i = 0; i < ids.length; i++) {
          requestedActivities
              = requestedActivities.concat(this.activities[ids]);
        }
        requestedValue = {
          // Real containers should set the requested stream here
          'requestedStream' : null,
          'activities' : new opensocial.Collection(requestedActivities)};
        break;
    }

    dataResponseValues[requestName]
        = new opensocial.ResponseItem(request, requestedValue, hadError);
    globalError = globalError || hadError;

  }

  callback(new opensocial.DataResponse(dataResponseValues, globalError));
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
opensocial.RailsContainer.prototype.newFetchPersonRequest = function(id,
    opt_params) {
  return {'type' : 'FETCH_PERSON', 'id' : id};
};

opensocial.RailsContainer.prototype.fetchPerson = function(id) {
	var person = null;
	
	new Ajax.Request('/feeds/people/' + id.toString(), {
		method: 'get',
		asynchronous: false, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var parser = new DOMParser();
			var xml = parser.parseFromString(transport.responseText, 'text/xml');
			
			var personHash = {
				'id': xml.$TAG('entry')[0].$TAG('id')[0].textContent,
				'name': xml.$TAG('entry')[0].$TAG('title')[0].textContent,
				'title': xml.$TAG('entry')[0].$TAG('title')[0].textContent,
				'updated': xml.$TAG('entry')[0].$TAG('updated')[0].textContent
			};
			person = new opensocial.Person(personHash, false, false);
		}
	});
	
	return person;
}


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
opensocial.RailsContainer.prototype.newFetchPeopleRequest = function(idSpec,
    opt_params) {
  return {'type' : 'FETCH_PEOPLE', 'idSpec' : idSpec};
};

opensocial.RailsContainer.prototype.fetchFriends = function(id) {
	var people = [];
	
	new Ajax.Request('/feeds/people/' + id.toString() + '/friends', {
		method: 'get',
		asynchronous: false, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var parser = new DOMParser();
			var xml = parser.parseFromString(transport.responseText, 'text/xml');
			var raw_people = xml.$TAG('entry');
			
			for(var i=0; i < raw_people.length; i++){
				var personHash = {
					'id': raw_people[i].$TAG('id')[0].textContent,
					'name': raw_people[i].$TAG('title')[0].textContent,
					'title': raw_people[i].$TAG('title')[0].textContent,
					'updated': raw_people[i].$TAG('updated')[0].textContent
				};
				people.push(new opensocial.Person(personHash, false, false));
			}
		}
	});
	
	return people;
}


/**
 * Used to request global app data.
 * When processed, returns a Map&lt;String, String&gt; object.
 *
 * @param {Array&lt;String&gt;|String} keys The keys you want data for. This
 *     can be an array of key names, a single key name, or "*" to mean
 *     "all keys".
 * @return {Object} a request object
 */
opensocial.RailsContainer.prototype.newFetchGlobalAppDataRequest = function(
    keys) {
  return {'type' : 'FETCH_GLOBAL_APP_DATA', 'keys' : keys};
};

opensocial.RailsContainer.prototype.fetchGlobalAppData = function() {
	var data = {};
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/global', {
		method: 'get',
		asynchronous: false, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var parser = new DOMParser();
			var xml = parser.parseFromString(transport.responseText, 'text/xml');
			
			var entries = xml.$TAG('entry');
			for(var j = 0; j < entries.length; j++) {
				data[entries[j].$TAG('title')[0].textContent] =
							entries[j].$TAG('content')[0].textContent;
			}
		}
	});
	this.globalAppData = data;
}


/**
 * Used to request instance app data.
 * When processed, returns a Map&lt;String, String&gt; object.
 *
 * @param {Array&lt;String&gt;|String} keys The keys you want data for. This
 *     can be an array of key names, a single key name, or "*" to mean
 *     "all keys".
 * @return {Object} a request object
 */
opensocial.RailsContainer.prototype.newFetchInstanceAppDataRequest = function(
    keys) {
  return {'type' : 'FETCH_INSTANCE_APP_DATA', 'keys' : keys};
};

opensocial.RailsContainer.prototype.fetchInstanceAppData = function() {
	var data = {};
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/VIEWER/instance', {
		method: 'get',
		asynchronous: false, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var parser = new DOMParser();
			var xml = parser.parseFromString(transport.responseText, 'text/xml');
			
			var entries = xml.$TAG('entry');
			for(var j = 0; j < entries.length; j++) {
				data[entries[j].$TAG('title')[0].textContent] =
							entries[j].$TAG('content')[0].textContent;
			}
		}
	});
	return data;
}


/**
 * Used to request an update of an app instance field from the server.
 * When processed, does not return any data.
 *
 * @param {String} key The name of the key
 * @param {String} value The value
 * @return {Object} a request object
 */
opensocial.RailsContainer.prototype.newUpdateInstanceAppDataRequest = function(
    key, value) {
  return {'type' : 'UPDATE_INSTANCE_APP_DATA', 'key' : key, 'value' : value};
};


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
opensocial.RailsContainer.prototype.newFetchPersonAppDataRequest = function(
    idSpec, keys) {
  return {'type' : 'FETCH_PERSON_APP_DATA', 'idSpec' : idSpec, 'keys' : keys};
};

opensocial.RailsContainer.prototype.fetchPersonAppData = function(ids) {
	// ids can contain: VIEWER, OWNER, OWNER_FRIENDS, or a specific person id
	for(var i=0; i < ids.length; i++) {
		var data = {};
		
		new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/' + ids[i] + '/shared', {
			method: 'get',
			asynchronous: false, // Need to change this to pipeline the process a bit
			onSuccess: function(transport) {
				var parser = new DOMParser();
				var xml = parser.parseFromString(transport.responseText, 'text/xml');
				
				var entries = xml.$TAG('entry');
				for(var j = 0; j < entries.length; j++) {
					data[entries[j].$TAG('title')[0].textContent] =
								entries[j].$TAG('content')[0].textContent;
				}
			}
		});
		this.personAppData[ids[i]] = data;
	}
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
opensocial.RailsContainer.prototype.newUpdatePersonAppDataRequest = function(id,
    key, value) {
  return {'type' : 'UPDATE_PERSON_APP_DATA', 'id' : id, 'key' : key,
    'value' : value};
};

opensocial.RailsContainer.prototype.createPersonAppData = function(userId, key, value) {
	// ids can contain: VIEWER, OWNER, OWNER_FRIENDS, or a specific person id
	atom = '<entry xmlns="http://www.w3.org/2005/Atom"><title>' + key + '</title><content>' + value + '</content></entry>'
	new Ajax.Request('/feeds/apps/' + this.appId + '/persistence/' + userId + '/shared', {
		method: 'post',
		contentType: 'application/atom+xml',
		parameters: encodeURIComponent(atom),
		asynchronous: false, // Need to change this to pipeline the process a bit
		onSuccess: function(transport) {
			var parser = new DOMParser();
			var xml = parser.parseFromString(transport.responseText, 'text/xml');
		}
	});
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
opensocial.RailsContainer.prototype.newFetchActivitiesRequest = function(idSpec,
    opt_params) {
  return {'type' : 'FETCH_ACTIVITIES', 'idSpec' : idSpec};
};
