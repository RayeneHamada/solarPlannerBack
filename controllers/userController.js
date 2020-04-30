const mongoose  = require('mongoose'),
User = mongoose.model('Users'),
axios = require('axios').default,
Project = mongoose.model('Projects');
const passport = require('passport');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mailer = require('../config/email')

exports.register = function(req,res,next)
{
        var user = new User();
        user.fullName = req.body.fullName;
        user.email = req.body.email;
        user.password = req.body.password;
        User.countDocuments({email:user.email}, function(err, c) {
          if(c == 0)
          {
            user.save((err, doc) => {  
              if (!err)
                 {    
                     
                     res.status(200).json({ "token": doc.generateJwt() });
                  }
              else {
                  if (err.code == 11000)
                      res.status(422).send(['Duplicate email adrress found.']);
                  else
                      return next(err);
              }
      
          });
          }
          else{
            res.status(403).send('There is already a used using this e-mail');
          }
         });
       
        
    
}

exports.authenticate = (req, res, next) => {
    // call for passport authentication
    passport.authenticate('local', (err, user, info) => {       
        // error from passport middleware
        if (err) return res.status(400).json(err);
        // registered user
        else if (user) return res.status(200).json({ "token": user.generateJwt() });
        // unknown user or wrong password
        else return res.status(404).json(info);
    })(req, res);
}

module.exports.userProfile = (req, res, next) =>{
    User.findOne({ _id: req._id },
        (err, user) => {
            if (!user)
                return res.status(404).json({ status: false, message: 'User record not found.' });
            else
                return res.status(200).json({ status: true, user : _.pick(user,['fullName','email']) });
        }
    );
}

module.exports.usersList = (req, res, next) =>{

    var users = [];
    User.find({'role':'user'},'fullName email ',(err,user)=>{
        if(!err)
        {
           
            for(let i=0;i<user.length;i++)
            {
                Project.countDocuments({owner:user[i].id},(err,projectNumber)=>{

                     users.push({'details':user[i],'projects':projectNumber});
                     if(i == user.length-1)
                        {
                            res.send(users);
                        }
                 });    
            }
        }
        else 
        {
            res.send(err);
        }
    })
}

exports.user_delete = function (req, res) {
    
    User.findByIdAndRemove(req.params.id, function (err) {
        if (err) return next(err);
        else{
            Project.deleteMany({'owner':req.params.id}, (err)=>{
                if(err) return next(err);
                return res.status(200).send('User deleted successfuly');
            })
        }
    })
};
  
exports.sendPasswordResetEmail = async (req, res) => {
    const { email } = req.params
    let user
    try {
      user = await User.findOne({ email }).exec();
      
    } catch (err) {
      res.status(404).json("No user with that email")
    }
    console.log(user);
    if(user)
    {const token = user.usePasswordHashToMakeToken();
    const url = mailer.getPasswordResetURL(user, token)
    const emailTemplate = mailer.resetPasswordTemplate(user, url)
  
    const sendEmail = () => {
      mailer.transporter.sendMail(emailTemplate, (err, info) => {
        if (err) {
          res.status(500).json("Error sending email")
        }
        else{
            res.status(200).send({status:'success'})
        }
      })
    }
    sendEmail()
  }
    else{
      res.status(400).json("No user found with this e-mail");
    }
  }

exports.receiveNewPassword = (req, res) => {
    const password  = req.body.password;
    const id =  req.body.id;    // highlight-start
    User.findById(id)
      .then(user => {
        if (req._id == user._id) {
          bcrypt.genSalt(10, function(err, salt) {
            if (err) return
            bcrypt.hash(password, salt, function(err, hash) {
              // Call error-handling middleware:
              if (err) return
              User.findOneAndUpdate({ _id: id }, { password: hash,saltSecret: salt })
                .then(() => res.status(202).json("Password changed accepted"))
                .catch(err => res.status(500).json(err))
            })
          })
        }
      })
      // highlight-end
      .catch(() => {
        res.status(404).json("Invalid user")
      })
  }

exports.updateFullName = (req,res) => {

  User.findOne({ _id: req._id },
    (err, user) => {
        if (!user)
            return res.status(404).json({ status: false, message: 'User record not found.' });
        else
            {
              user.fullName = req.body.fullName;
              User.updateOne({_id: user._id}, user).then(
                () => {
                  res.status(201).json({
                    message: 'User updated successfully!'
                  });
                }
              ).catch(
                (error) => {
                  res.status(400).json({
                    error: error
                  });
                }
              );
            }
    });
}

exports.updatePassword = (req,res) => {

  User.findOne({ _id: req._id },
    (err, user) => {
        if (!user)
            return res.status(404).json({ status: false, message: 'User record not found.' });
        else
            {
              bcrypt.hash(req.body.oldPassword, user.saltSecret, function(err, hash) {
                if (hash == user.password)
                {
                  
                  bcrypt.genSalt(10, function(err, salt) {
                    if (err) return
                    bcrypt.hash(req.body.newPassword, salt, function(err, hash1) {
                      // Call error-handling middleware:
                      if (err) return
                      user.password = hash1;
                      user.saltSecret = salt;
                      User.findOneAndUpdate({ _id: user._id }, user)
                        .then(() => res.status(202).json("Password changed Successfuly"))
                        .catch(err => res.status(500).json(err))
                    })
                  })
                }
                else
                {
                  res.status(400).send('wrong password')
                }
              });
              
            }
          
    });
          
}

exports.admin_user_profile = function(req,res){
  User.findOne({ _id: req.params.id },'fullName email ',(err,user)=>{
    if(!err)
    {
   
            Project.countDocuments({owner:user.id},(err,projectNumber)=>{
                if(!err)
                    {res.status(200).send({'user':user,'project_number':projectNumber});}
                else{
                  res.status(500).send(err);
                }
                    
             });    
        
    }
    else 
    {
        res.status(400).send(err);
    }
})
}

exports.test = function(req,res){

  const config = {
    headers: { Authorization: `Bearer `+req.body.access_token }
};
axios.get( 
  'https://www.googleapis.com/oauth2/v3/userinfo',
  config
).then(function(response){
  
  console.log(response.data);
}).catch(console.log);
}


