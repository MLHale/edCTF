import Ember from 'ember';

export default Ember.Controller.extend({
  modal: {},
  authController: null,
  validatorController: null,
  ctf: null,
  session: {
    'isAuthenticated': false,
  },
  updateTitle: function() {
    Ember.$(document).attr('title', this.get('ctf.name'));
  }.observes('ctf.name'),
  init: function(){
    this._super();

    // Function to reload async models (currently ember doesn't support this well)
    var reloadModels = function(parentRecord) {
      parentRecord.reload();
      parentRecord.eachRelationship(function(childRecord, childRelation){
        if (childRelation.options && childRelation.options.async){
          var id = parseInt(parentRecord.toJSON()[childRecord]);
          var foundRecord = parentRecord.store.peekRecord(childRecord, id);
          if (foundRecord){
            foundRecord.reload();
          }
        }
      });
    };

    // Update ctf model data every 30 seconds
    var interval = 1000 * 30 * 1;
    var modelReload = function() {
      reloadModels(this.get('ctf'));
      Ember.run.later(this, modelReload, interval);
    };
    Ember.run.later(this, modelReload, interval);
  },
  actions: {
    login: function(authenticationData) {
      var t = this;
      var auth = t.get('authController');

      // Attempt to login the team
      auth.login(authenticationData, function(){
        // If there was no error during authentication close the login modal 
        if(!auth.get('errorMessage')){
          t.set('session', auth.session);
          t.set('modal.isLogin', false);
        }
      });
    },
    register: function(registrationData) {
      var t = this;
      var auth = this.get('authController');
      
      // Attempt to register the team
      auth.register(registrationData, function(){
        // If there was no error during registration close the register modal 
        if (!auth.get('errorMessage')) {
          t.set('session', auth.session);
          t.set('modal.isRegister', false);
        }
      });
    },
    submitFlag: function(challengeid, flag, callback) {
      var flagData = {'flag': flag};
      var namespace = this.get('store').adapterFor('application').namespace;
      Ember.$.ajax({
        url: namespace+'/challenges/'+challengeid,
        type: 'POST',
        data: JSON.stringify(flagData),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        crossDomain:false,
        processData: false,
        beforeSend: function(xhr) {
          xhr.setRequestHeader("X-CSRFToken", Ember.$.cookie('csrftoken'));
        },
        success: function (result){
          callback(result.success, result.error);
        }, error: function () {
          callback(false, 'Something went wrong');
        },
      });
    },
    logout: function() {
      var t = this;
      var auth = this.get('authController');

      // Attempt to logout
      auth.logout(function(){
        t.set('session', auth.session);

        // Redirect to the home page
        t.transitionToRoute('home');
      });
    },
    openLoginModal: function() {
      this.set('modal.isLogin', true);
    },
    openRegisterModal: function() {
      this.set('modal.isRegister', true);
    },
  }
});
