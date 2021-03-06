const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const User = require('../model/user');
const Authorization = require('../middleware/authentication'); //const { verifyToken } = require('../middleware/authentication')

const app = express();

app.get('/users', Authorization.verifyToken, function(req, res) {

    let from = req.query.from || 0;
    from = Number(from);

    let limit = req.query.limit || 5;
    limit = Number(limit);

    let filter = { active: true };

    User.find(filter, 'name email role active google img')
        .skip(from)
        .limit(limit)
        .exec((err, users) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            User.count(filter, (err, count) => {
                res.json({
                    ok: true,
                    users,
                    count
                });
            });
        });
});

app.get('/users/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id, (err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (!userDB) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'There is not any user with that ID'
                }
            });
        }
        res.json({
            ok: true,
            user: userDB,
        });
    });

});

app.post('/users', [Authorization.verifyToken, Authorization.verifyAdminRole], function(req, res) {
    let body = req.body;

    let user = new User({
        name: body.name,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    user.save((err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.status(201).json({
            ok: true,
            user: userDB
        });
    })
});

app.put('/users/:id', Authorization.verifyToken, function(req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, ['name', 'email', 'img', 'role', 'active']);

    User.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            user: userDB
        });
    });
});

app.delete('/users/:id', [Authorization.verifyToken, Authorization.verifyAdminRole], function(req, res) {
    let id = req.params.id;

    // User.findByIdAndRemove(id, {}, (err, deletedUser) => {
    User.findByIdAndUpdate(id, { active: false }, { new: true }, (err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            user: userDB
        });
    });
});

module.exports = app;