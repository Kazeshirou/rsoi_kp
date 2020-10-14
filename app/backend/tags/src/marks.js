const Marks = require('./marksModel');

const create = async (mark) => {
    return await Marks.create(mark);
}

const get = async (query) => {
    try {
        return await Marks.get(query);
    } catch (err) {
        throw err;
    }
}

module.exports = { create, get };