const { NotFoundError, ValidationError, ConflictError } = require("../errors");

function TaskServices(repo) {

    // ---------- GET ----------

    async function getStats() {
        const total = await repo.countTasks();
        const done = await repo.countTasks(true);
        const remaining = await repo.countTasks(false);
        return {
            "total": total,
            "completed": done,
            "remaining": remaining
        }
    }

    async function getAllTasks({ done, search, sorted }) {
        return await repo.getTasks({ done, search, sorted });
    }

    async function getTask({ id, title }) {
        if (id !== undefined) {
            const task = await repo.getTaskById(id);
            if (!task) throw new NotFoundError(`Task ${id} not found`);
            return task;
        }
        else if (title !== undefined) {
            const task = await repo.getTaskByTitle(title);
            if (!task) throw new NotFoundError(`Task \`${title}\` not found`);
            return task;
        }
        else throw new ValidationError(`Invalid title or id`);
    }

    // ---------- POST ----------

    async function createTask(title) {
        if (!title) throw new ValidationError("Title is empty");

        const existing = await repo.getTaskByTitle(title);
        if (existing) throw new ConflictError(`Task \`${title}\` already exists`);

        return await repo.createTask(title);
    }
    async function resetTasks() {
        await repo.resetTasks();
        return await repo.getTasks();
    }
    // ---------- PUT ----------

    async function updateTask(id, { title, done }) {
        if (done === undefined && (title === undefined || title.trim() === ""))
            throw new ValidationError(`Request body must include a valid title or done status`);

        const existing = await repo.getTaskById(id);
        if (!existing) throw new NotFoundError(`Task ${id} not found`);

        const newTitle = title ?? existing.title;
        const newDone = done !== undefined ? done : existing.done;


        const duplicate = await repo.getTaskByTitle(newTitle);
        if (duplicate && duplicate.id !== id) throw new ConflictError(`Task \`${newTitle}\` already exists`);

        const updated = await repo.updateTask(id, { newTitle, done: newDone });

        if (newTitle === existing.title && newDone === existing.done) {
            return { ...updated, message: "no change" };
        }

        return updated;
    }
    // ---------- DELETE ----------

    async function deleteTask(id) {
        const deleted = await repo.deleteTask(id);
        if (!deleted) throw new NotFoundError(`Task ${id} not found`);
    }


    return {
        getStats,
        getAllTasks,
        getTask,
        createTask,
        updateTask,
        deleteTask,
        resetTasks,
    };
}

module.exports = { TaskServices };