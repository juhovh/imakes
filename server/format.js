var moment = require('moment');

exports.title = function(title) {
  if (!title || title.trim() === '') {
    return '(No Title)';
  }
  return title;
};

exports.author = function(author) {
  if (!author) {
    return '(Unknown)';
  } else if (match = author.match(new RegExp('\\"(.*)\\".*<.*>'))) {
    return match[1].trim();
  } else if (match = author.match(new RegExp('(.*)<.*>'))) {
    return match[1].trim();
  } else if (match = author.match(new RegExp('(.*)@.*'))) {
    return match[1].trim();
  }
  return author;
};

exports.user = function(user) {
  var username = '';
  if (user.displayname && user.displayname.trim() !== '') {
    username += user.displayname;
  } else if (user.username) {
    return user.username;
  }
  if (user.username && user.username.trim() !== '') {
    username += ' ('+user.username+')';
  }
  return username;
};

exports.date = function(datetime) {
  return moment(datetime).format('ddd DD.MM.YYYY');
};

exports.time = function(datetime) {
  return moment(datetime).format('HH:mm');
};
