import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AmocrmService {
  private accessToken: string;
  private refreshToken: string;
  private refreshTimeout: NodeJS.Timeout;
  private readonly clientId = 'd4e0ed50-31e9-4f30-816d-141dc1b6be22';
  private readonly clientSecret =
    'ORg2m0vUqsypXAB2IT9IJZvcy59d4FQ79qSf5AcgmXyC3T96HwKhqUouJRUxSn0S';
  private readonly api = 'https://follik42.amocrm.ru/';
  private readonly redirectUri = 'http://localhost:3000/amocrm/callback';
  private readonly grantType = 'authorization_code';
  private readonly code =
    'def502007c3a36f55c3bea2d8d429711a442d022490fdeb661bef2fb9afbfd4fe4369533c2db86c367881ea6a3efe3b0723b4184b992e7936559acec1840feaf9650c377fdcdde51a17809a43e648605fa0a0a50617c9783af5d5b35f7f377f3f88fe766dd6d6cee3e86eb02972a1b3ab7cafffb678f61a3d01dbcec3f4ec576c86c2a4b0e58bf9347ea5675554f86b7943ebcc645c15a351946f0d77d310e6e50297e2b26a1a78d0eef9351236ef10e605eb922ba6e1d65836825c37fb97eece5033920828d4daefc58ed0acdaf8f52f0c035111f3ef773433934e6864d4a72f0460cb5df981483b9ec14d9b9da972f72157f5a84560776e76148e3a62bdbfcc1c0098e229ae698691635426546473ba62293bf70dc6a30e11f47468df237224f2441bcbacb4648b1c74300607acbb89fce46aba68c54ca0b84406d2573b0cdd601db26ca6e43eb91899b6b83f137aee1e771ab7fed902a7af247bd303d769974ebee475978a10111873510a11027d85ea72314c407d09b365b090f82ea890adeb9e324705a8531147d55ded51c62d79fd6a518e9eb13611595a2e90c557bdceaa171a5f572557ef0f6e82447b851170d76a678239e60044b85ba566a1ab28635d0527d29bded5c65f7821db6412aa232a783629b8879b5aab0a3c9fe49643e58be9de5b781c8fff4d7ab13c77e9f9217fd8277397e69bf';

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
