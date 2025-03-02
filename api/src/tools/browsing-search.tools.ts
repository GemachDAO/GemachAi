import axios from "axios";
import { ConfigService } from "@nestjs/config";
import configuration from "src/configuration";
const configService = new ConfigService(configuration());
import * as cheerio from "cheerio";
import { Injectable } from "@nestjs/common";
import { Tool } from "./tool.decorator";
import { z } from "zod";
import { GoogleSearchQuerySchema, URLContentSchema } from "./validations/tools-validation";

@Injectable()
export class BrowsingSearchTools {
    constructor(private readonly configService: ConfigService) { }

    @Tool({
        name: 'getURLContent',
        description: 'Get the content of a URL',
        schema: URLContentSchema
    })
    async getURLContent(args: z.infer<typeof URLContentSchema>) {
        try {
            const request = await axios.get(args.url)
            const $ = cheerio.load(request.data, {
            }, true);
            const unwanTed = ['script', 'meta', 'style', 'svg', 'button', 'img', 'link', 'a', 'figure', 'form', 'picture', 'noscript']
            unwanTed.forEach(tag => {
                $(tag).remove()
            })
            // let lines = $.html().split('\n');
            let lines = $('body').text().split('\n');
            let nonBlankLines = lines.filter(line => line.trim() !== '');
            let outputString = nonBlankLines.join('\n');
            return outputString;
        } catch (error) {
            console.log(error);
            throw new Error('error fetching page content');
        }
    }

    @Tool({
        name: ' ',
        description: 'Get the search results of a query',
        schema: GoogleSearchQuerySchema
    })
    async searchGoogle(args: z.infer<typeof GoogleSearchQuerySchema>) {
        try {
            const formattedQuery = args.query.split(' ').join('+');
            const request = await axios.get(`https://www.googleapis.com/customsearch/v1?key=${configService.get('googleApiKey')}&cx=${configService.get('searchEngineId')}&q=${formattedQuery}`)
            const results = request.data.items as {
                kind: string,
                title: string,
                htmlTitle: string,
                link: string,
                displayLink: string,
                snippet: string,
                htmlSnippet: string,
                cacheId: string,
                formattedUrl: string,
                htmlFormattedUrl: string,
                pagemap: {}
            }[];
            // create a variable data to filter out the results by saving properties title, link, snippet and formattedUrl
            const data = results.map(({ title, link, snippet, formattedUrl }) => ({ title, link, snippet, formattedUrl }));
            console.log(data);
            return data
        } catch (error) {
            console.log(error);
            return { message: 'error making google search' }
        }

    }
}

