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
opensocial.RailsContainer = function(baseUrl, opt_owner, opt_appId) {
  this._baseUrl = baseUrl;
  this.viewer = opt_owner;
  this.owner = opt_owner;
  // this.viewerFriends = opt_viewerFriends || {};
  //   this.ownerFriends = opt_ownerFriends || {};
  //   this.globalAppData = opt_globalAppData || {};
  //   this.instanceAppData = opt_instanceAppData || {};
  //   this.personAppData = opt_personAppData || {};
  //   this.activities = opt_activities || {};
  this.appId = opt_appId || 'sampleContainerAppId';
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
        if (personId == opensocial.DataRequest.PersonId.VIEWER) {
          requestedValue = this.viewer;
        } else if (personId == opensocial.DataRequest.PersonId.OWNER) {
          requestedValue = this.owner;
        } else {
          requestedValue = this.viewerFriends.getById(personId)
              || this.ownerFriends.getById(personId);
        }
        break;

      case 'FETCH_PEOPLE' :
        var idSpec = request.idSpec;
        var persons = [];
        if (idSpec == opensocial.DataRequest.Group.VIEWER_FRIENDS) {
          persons = this.viewerFriends.asArray().concat();
        } else if (idSpec == opensocial.DataRequest.Group.OWNER_FRIENDS) {
          persons = this.ownerFriends.asArray().concat();
        } else {
          if (!opensocial.Container.isArray(idSpec)) {
            idSpec = [idSpec];
          }
          for (var i = 0; i < idSpec.length; i++) {
            var person = this.viewerFriends.getById(idSpec[i]);
            if (person == null) {
              person = this.ownerFriends.getById(idSpec[i]);
            }
            if (person != null) {
              persons.push(person);
            }
          }
        }
        requestedValue = new opensocial.Collection(persons);
        break;

      case 'FETCH_GLOBAL_APP_DATA' :
        var values = {};
        var keys =  request.keys;
        for (var i = 0; i < keys.length; i++) {
          values[keys[i]] = this.globalAppData[keys[i]];
        }
        requestedValue = values;
        break;

      case 'FETCH_INSTANCE_APP_DATA' :
        var values = {};
        var keys =  request.keys;
        for (var i = 0; i < keys.length; i++) {
          values[keys[i]] = this.instanceAppData[keys[i]];
        }
        requestedValue = values;
        break;

      case 'UPDATE_INSTANCE_APP_DATA' :
        this.instanceAppData[request.key] = request.value;
        break;

      case 'FETCH_PERSON_APP_DATA' :
        var ids = this.getIds(request.idSpec);

        var values = {};
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i];
          if (this.personAppData[id]) {
            values[id] = {};
            for (var j = 0; j < request.keys.length; j++) {
              values[id][request.keys[j]]
                  = this.personAppData[id][request.keys[j]];
            }
          }
        }
        requestedValue = values;
        break;

      case 'UPDATE_PERSON_APP_DATA' :
        var userId = request.id;
        // Gadgets can only edit viewer data
        if (userId == opensocial.DataRequest.PersonId.VIEWER
            || userId == this.viewer.getId()) {
          userId = this.viewer.getId();
          this.personAppData[userId] = this.personAppData[userId] || {};
          this.personAppData[userId][request.key] = request.value;
        } else {
          hadError = true;
        }

        break;

      case 'FETCH_ACTIVITIES' :
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