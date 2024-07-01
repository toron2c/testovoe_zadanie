import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AmocrmService {
  private accessToken: string = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNjOWJkYWRjMzViNDBiNmFhYWYyOTNhZDYwODQxMWYyYTM3M2ZlODY4MmE4OWNlYjY5YTFkZmI4Y2EzMmNkYWNkY2IwNWU3NzhmOGE1ZmI0In0.eyJhdWQiOiJkNGUwZWQ1MC0zMWU5LTRmMzAtODE2ZC0xNDFkYzFiNmJlMjIiLCJqdGkiOiIzYzliZGFkYzM1YjQwYjZhYWFmMjkzYWQ2MDg0MTFmMmEzNzNmZTg2ODJhODljZWI2OWExZGZiOGNhMzJjZGFjZGNiMDVlNzc4ZjhhNWZiNCIsImlhdCI6MTcxOTgwNzUxMiwibmJmIjoxNzE5ODA3NTEyLCJleHAiOjE3MjIzODQwMDAsInN1YiI6IjExMjE2NDc0IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxODI1MjI2LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMTc4YjVjMGItNWU1YS00MmVkLWIzY2YtMzk4YTc1MmMyNzZlIn0.fpNEdgUnMhpYI9f4Og1SH7uQRLtatwoGeuf8b2WVkyJn0bbZG8HKjWEUu8fzJ6LYTbxhltI03NDb4n47Nt2HB5EltBd2bhp6YLLiQXW0jOFZfGvJYywndcryo_6ZV2jPkLrhIB7xSADCBOTdvnjMmGpAnOEzuebI1m9g4e7nwCGamKs76nAQ1L0jPeFzCeGprFMU5UsTdjBQaSxe205alB_WDsP2kjBxXprzgD-kHRRyuRSCd_7gLOiQduIr5rd8_Mtoo9Y72KzfPqlDnQi-09NUCJWB57yya0h-1U9bDRK_TBkxKVLgTenGe5448AUNpPpeCN5uijAaLZakJEQEDw';
  private refreshToken: string;
  private refreshTimeout: NodeJS.Timeout;
  private readonly clientId = 'd4e0ed50-31e9-4f30-816d-141dc1b6be22';
  private readonly clientSecret =
    'ORg2m0vUqsypXAB2IT9IJZvcy59d4FQ79qSf5AcgmXyC3T96HwKhqUouJRUxSn0S';
  private readonly api = 'https://follik42.amocrm.ru/';
  private readonly redirectUri = 'http://localhost:3000/amocrm/callback';
  private readonly grantType = 'authorization_code';

  // code для авторизации (действует только 20 мин)
  private readonly code =
    'def5020046472bcb404dee8bed180c0f4555b314ce5f9c8e8eb7eda24ee038ede3df96c711e8a8b2d32025a2152435b58343032c3143a0a9cc160abffae94719909a05d2f732b80580f3be45bc302b46bf893ca68654dcd19662d894152a0abc257c806aed97925aa9adc2e3a04194fd75221c7b0df6f972d2cb844140cf9ae33e97924c847e56c0d458f66543b1e40fb0548603d23ba45062e9f51e4728c7797fa6ace53442d23a6efc130991afbe7d70ee92b8c15e9dd9f118af437a5661162136df4734e0ba61bf92ff1953ad5941bd6ec6bc0b277c60253d68c9fca048d32ff0bcfd7a1f8ab2afa8513dc5a4c46887cdfc21e6be0f78a698d7f4b320c026a887ffd63261518eb7aed1672861d928b944fc0d2fe616650d8f247724ebf1dd540311facb31e11871ae8961ad48febbbb7150b96179a0114a4baf1c6446829c6294c277b790bbcf52fa87a62c78ae73b2cbd5f1a5a5205c22b89a33dd57336487179037ce081cda999f9b6404d608ddb9e5c57bf009b245aa734f0955ad71bcc0a2048eea57393c08eb82cba1d3515f018829f62a2768d56770e0c8701f48b975356b94749fae5ac8c485988828b26a16d06cec6567b83ad025c0ec97fcf2207031720db691b12fd0b40120add13a88e0d89815bca55ae1ea50d6889226bce6a889b94bf3feddaa30d0877d67dac25b61ca273de937a48b';

  constructor() {}

  // init tokens
  async getTokens() {
    try {
      const response = await axios.post(`${this.api}oauth2/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: this.code,
        redirect_uri: 'http://localhost:3000/amocrm/callback',
      });

      //set tokens
      this.setTokens(response.data.access_token, response.data.refresh_token);

      //task updatetokens
      this.refreshTimeout = setTimeout(
        () => this.taskTokenRefresh(),
        (response.data.expires_in - 300) * 1000,
      );
    } catch (e) {
      console.log(e);
      throw new BadRequestException(
        'Возникла ошибка при инициализации токенов',
      );
    }
  }

  // gen tokens
  async genTokens() {
    try {
      const response = await axios.post(`${this.api}oauth2/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      });

      // set tokens
      this.setTokens(response.data.access_token, response.data.refresh_token);
      // task update tokens
      this.refreshTimeout = setTimeout(
        () => this.taskTokenRefresh(),
        (response.data.expires_in - 300) * 1000,
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Возникла ошибка при обновлении токенов');
    }
  }
  // get Token for query
  getAccessToken(): string {
    return this.accessToken;
  }
  async getLeads(query?: string) {
    try {
      const response = await axios.get(`${this.api}/api/v4/leads`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          query: query ? query : '',
          with: 'contacts',
        },
      });
      if (response.data && response.data._embedded.leads) {
        const data = await Promise.all(
          response.data._embedded.leads.map(async (el, index) => {
            await this.delay(500 * index);
            return {
              id: el.id,
              name: el.name,
              price: el.price,
              responsible_user: await this.getResponsibleUser(
                el.responsible_user_id,
              ),
              created: el.created_by,
              status: el.status_id,
              pipeline: await this.getPipeline(el.pipeline_id, el.status_id),
              contacts: await this.getContacts(el._embedded.contacts),
            };
          }),
        );
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Возникла ошибка при получении сделок');
    }
  }
  async getResponsibleUser(id: string) {
    try {
      const res = await axios.get(`${this.api}/api/v4/users/${id}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return res.data.name;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Возникла ошибка при получении данных менеджера',
      );
    }
  }
  //get status voronki
  async getPipeline(pipelineId: string, statusId: string) {
    try {
      const res = await axios.get(
        `${this.api}/api/v4/leads/pipelines/${pipelineId}/statuses/${statusId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
      return {
        name: res.data.name,
        color: res.data.color,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Возникла ошибка при получении статуса сделки',
      );
    }
  }

  // get name contact
  async getContacts(contacts: any) {
    if (contacts) {
      const arr = await Promise.all(
        contacts.map(async (el) => await this.getContact(el.id)),
      );
      return arr;
    }
  }

  // get ContactField
  async getContact(id: string) {
    try {
      const res = await axios.get(`${this.api}/api/v4/contacts/${id}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      if (res.data && res.data.custom_fields_values) {
        return {
          name: res.data.name,
          fields: res.data.custom_fields_values.map((el) => {
            return {
              link: el.field_code,
              value: el.values.map((el) => el.value),
            };
          }),
        };
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Возникла ошибка при получении данных контакта',
      );
    }
  }
  // func create task for update tokenns
  private async taskTokenRefresh() {
    await this.genTokens();
  }

  // set tokens
  private setTokens(access_token: string, refresh_token: string) {
    this.accessToken = access_token;
    this.refreshToken = refresh_token;
  }
  // timeout
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // удаление таймера обновления токена
  onModuleDestroy() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
}
