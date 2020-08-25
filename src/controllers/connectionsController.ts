import { Request, Response } from 'express'
import db from '../database/connection'

export default class ConnectionsController {
    async count(request: Request, response: Response) {
        const foundCount = await db('connections').count('* as count');
        const { count } = foundCount[0];
        return response.json({
            count
        });
    }

    async create(request: Request, response: Response) {
        const { user_id } = request.body

        if (!user_id) {
            return response.status(400).json({
                message: "user_id field required"
            });
        }

        const insertedUserIds = await db('connections').insert({
            user_id
        });
        return response.status(201).json({
            id: insertedUserIds[0]
        });
    }
}