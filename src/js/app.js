const app = {
    // Properties
    buttons: document.getElementsByTagName('button'),
    form: document.querySelector('form'),
    formTitle: document.querySelector('form span'),
    input: document.querySelector('form input'),
    monitor: document.getElementById('monitor'),
    activity: 'activity-1',


    // App init
    init: function() {
        for (const button of app.buttons) {
            button.addEventListener('click', app.handleSelection);
        }
    },

    // Methods
    handleSelection: function(evt) {
        // Catch actiity from selection
        app.activity = evt.target.getAttribute('data-activity');
        // Toggle active class
        for (const button of app.buttons) {
            button.classList.remove('active');
        }

        evt.target.classList.add('active');
        // Set ID for input field
        app.input.id = app.activity;
        // Set form title
        app.formTitle.textContent = evt.target.textContent;
    }
};

document.addEventListener('DOMContentLoaded', app.init);