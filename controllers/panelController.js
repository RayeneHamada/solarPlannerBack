const mongoose  = require('mongoose'),
Panel = mongoose.model('Panels');

exports.newPanel = function(req,res,next)
{
    panel = new Panel();
    panel.name = req.body.name;
    panel.capacity = req.body.capacity;
    panel.height = req.body.height;
    panel.width = req.body.width;
    panel.type = 'global';
    panel.technology = req.body.technology;
    if(req.body.type)
    {
        panel.type =  req.body.type;
    }

    panel.owner = req._id;
    panel.save((err,doc) => {
        if(err){
            return res.status(500).send(err);
        }
        else{
            return res.status(200).send(doc.name+' is a panel now');
        }
    })
}
exports.AllPanels = function(req,res,next)
{
    Panel.find({}).populate('owner','fullName').exec((err,docs) => {
        if(!err){
            res.status(200).send(docs);
        }
    })
}
exports.GlobalPanels = function(req,res,next)
{
    Panel.find({'type':'global'},(err,docs) => {
        if(!err){
            res.status(200).send(docs);
        }
    })
}
exports.deletePanel = function(req,res,next){
    Panel.findByIdAndRemove(req.params.id,(err,docs) =>{
        if(!err){
            return res.status(200).send('Panel deleted successfuly ya boss');
        }
        else{
            return res.status(500).send(err);
        }
    })
}
exports.myPanels = function(req,res){
    
    Panel.find({'owner':req._id},(err,docs)=>{
        if(!err){
            return res.status(200).send(docs);
        }
        else{
            return res.status(500).send(err)
        }
    })
}