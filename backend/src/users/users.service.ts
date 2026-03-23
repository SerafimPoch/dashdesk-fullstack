import { Injectable } from '@nestjs/common';

interface UserData {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: '1',
      name: 'user-1',
      email: 'serafimpoch@gmail.com',
      password: '12345678',
    },
  ];

  create(data: UserData) {
    const id = crypto.randomUUID();
    this.users.push({ id, ...data });

    return { id, ...data };
  }

  findByEmail(email: string) {
    return this.users.find((e) => e.email === email);
  }
}
