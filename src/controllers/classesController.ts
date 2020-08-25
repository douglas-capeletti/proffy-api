import { Request, Response } from 'express'
import db from '../database/connection';
import { hourToMinute } from '../util/timeConverter';

interface ScheduleItem {
    week_day: number,
    from: string,
    to: string
}

export default class ClassesController {

    async index(request: Request, response: Response) {
        const week_day = Number(request.query.week_day);
        const subject = String(request.query.subject);
        const time = String(request.query.time);

        if (!week_day || !subject || !time) {
            return response.status(400).json({
                message: "Missing some filter",
                sentFilters: request.query
            })
        }

        const timeInMinutes = hourToMinute(time);

        const classes = await db('classes')
            .whereExists(function () {
                this.select('class_schedule.*')
                    .from('class_schedule')
                    .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
                    .whereRaw('`class_schedule`.`week_day` = ??', [week_day])
                    .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                    .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'users.id')
            .select(['classes.*', 'users.*'])
            
        return response.json(classes)
    }

    async create(request: Request, response: Response) {
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = request.body;

        const trx = await db.transaction();

        try {
            const insertedUsersIds = await trx('users').insert({
                name,
                avatar,
                whatsapp,
                bio
            });

            const user_id = insertedUsersIds[0];

            const insertedClassesIds = await trx('classes').insert({
                subject,
                cost,
                user_id
            });

            const class_id = insertedClassesIds[0];

            const classSchedule = schedule.map((item: ScheduleItem) => {
                return {
                    class_id,
                    week_day: item.week_day,
                    from: hourToMinute(item.from),
                    to: hourToMinute(item.to)
                };
            });

            await trx('class_schedule').insert(classSchedule)

            await trx.commit();
            return response.status(201).json({
                id: class_id
            });
        } catch {
            await trx.rollback();
            return response.status(500).json({
                message: 'Unexpected exception'
            });
        }
    }
}