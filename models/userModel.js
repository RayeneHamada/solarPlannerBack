const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema({
    method: {
      type: String,
      enum: ['local', 'google'],
      required: true
    },
    local: {
      email: {
        type: String,
        lowercase: true
      },
      password: { 
        type: String
      },
      saltSecret: String
    },
    google: {
      email: {
        type: String,
        lowercase: true
      }
    },
  
      fullName: {
          type: String,
          required: 'Full name can\'t be empty'
      },
      role: {
          type: String,
          required: 'Role can\'t be empty',
          default: 'user'
      },
      saltSecret: String
  });

// Custom validation for email
userSchema.path('local.email').validate((val) => {
    emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(val);
}, 'Invalid e-mail.');

// Events
userSchema.pre('save', function (next) {
    try {
        if (this.method !== 'local') {
          next();
        }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(this.local.password, salt, (err, hash) => {
            this.local.password = hash;
            this.local.saltSecret = salt;
            next();
        });
    });} 
    catch(error) {
        next(error);
      }
    
});


// Methods
userSchema.methods.verifyPassword = function (password) {
    
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.generateJwt = function () {
    return jwt.sign({ _id: this._id, role: this.role},
        process.env.JWT_SECRET,
    {
        expiresIn: process.env.JWT_EXP
    });
}
userSchema.methods.usePasswordHashToMakeToken = function(){
    const secret = this.local.password + "-" + this.create_date
    const token = jwt.sign({id:this._id}, process.env.JWT_SECRET, {
      expiresIn: 3600 // 1 hour
    })
    return token
  }



mongoose.model('Users', userSchema);