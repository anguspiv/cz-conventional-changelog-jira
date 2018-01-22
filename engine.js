"format cjs";

var wrap = require('word-wrap');
var map = require('lodash.map');
var longest = require('longest');
var rightPad = require('right-pad');

var filter = function(array) {
  return array.filter(function(x) {
    return x;
  });
};

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = function (options) {

  var types = options.types;
  var issueStatus = [{
    name: 'No Change',
    key: '',
  }, {
    name: 'To Do',
    key: '#to-do',
  }, {
    name: 'In Progress',
    key: '#in-progress',
  }, {
    name: 'In Testing',
    key: '#in-testing',
  }, {
    name: 'Done',
    key: '#done',
  }];

  var length = longest(Object.keys(types)).length + 1;
  var choices = map(types, function (type, key) {
    return {
      name: rightPad(key + ':', length) + ' ' + type.description,
      value: key
    };
  });

  return {
    // When a user runs `git cz`, prompter will
    // be executed. We pass you cz, which currently
    // is just an instance of inquirer.js. Using
    // this you can ask questions and get answers.
    //
    // The commit callback should be executed when
    // you're ready to send back a commit template
    // to git.
    //
    // By default, we'll de-indent your commit
    // template and will keep empty lines.
    prompter: function(cz, commit) {
      console.log('\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

      // Let's ask some questions of the user
      // so that we can populate our commit
      // template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input
      // collection library if you prefer.
      cz.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Select the type of change that you\'re committing:',
          choices: choices
        }, {
          type: 'input',
          name: 'scope',
          message: 'What is the scope of this change (e.g. component or file name)? (press enter to skip)\n'
        }, {
          type: 'input',
          name: 'subject',
          message: 'Write a short, imperative tense description of the change:\n'
        }, {
          type: 'input',
          name: 'body',
          message: 'Provide a longer description of the change: (press enter to skip)\n'
        }, {
          type: 'confirm',
          name: 'isBreaking',
          message: 'Are there any breaking changes?',
          default: false
        }, {
          type: 'input',
          name: 'breaking',
          message: 'Describe the breaking changes:\n',
          when: function(answers) {
            return answers.isBreaking;
          }
        }, {
          type: 'input',
          name: 'issue',
          message: 'What is the ticket for this commit? (e.g. JIRA-1234)',
        }, {
          type: 'list',
          name: 'status',
          message: 'What is the status of the ticket (e.g. In Progress, Done)? (press enter to skip)\n',
          choices: issueStatus,
          default: '',
        }, {
          type: 'input',
          name: 'issueComment',
          message: 'Is there a comment for the Jira Ticket? (Press enter to skip)\n',
        }
      ]).then(function(answers) {

        const MAX_LINE_WIDTH = 100;

        var wrapOptions = {
          trim: true,
          newline: '\n',
          indent:'',
          width: MAX_LINE_WIDTH,
        };

        // parentheses are only needed when a scope is present
        var scope = answers.scope.trim();
        scope = scope ? `(${answers.scope.trim()})` : '';

        // Hard limit this line
        const subject = answers.subject.trim()
        let head = `${answers.type}${scope}: ${answers.subject.trim()}`;
        head = head.slice(0, MAX_LINE_WIDTH);

        // Wrap these lines at 100 characters
        let body = wrap(answers.body, wrapOptions);

        // Apply breaking change prefix, removing it if already present
        let breaking = answers.breaking ? answers.breaking.trim() : '';
        breaking = breaking.replace(/^BREAKING CHANGE: /, '');
        breaking = breaking ? `BREAKING CHANGE: ${breaking}` : '';
        breaking = wrap(breaking, wrapOptions);

        let issues = answers.issues;
        let comment = answers.issueComment ? answers.issueComment.trim().slice(0, MAX_LINE_WIDTH) : '';

        issues = answers.status ? `${issues} ${answers.status}` : issues;
        issues = comment ? `${issues} #comment ${comment}` : issues;

        issues = answers.issue ? wrap(answers.issues, wrapOptions) : '';

        let footer = filter([ breaking, issues ]).join('\n\n');

        commit(`${head}\n\n${body}\n\n${footer}`);
      });
    }
  };
};
