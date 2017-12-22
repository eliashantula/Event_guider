module.exports = {
  facebookAuth: {
    clientID: "153994628557132", // your App ID
    clientSecret: "ec815c0d8fd0668c51668028fda4a069", // your App Secret
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    //'profileURL'    : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
    profileFields: ["email", "name"] // For requesting permissions from Facebook API
  }
};
