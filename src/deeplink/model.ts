export interface PaylisherResolvedDeepLinkPayload {
    _id?: { $oid?: string };
    teamId?: string;
    projectId?: string;
    sourceId?: string;
    type?: string;
    title?: string;
    keyName?: string;
    webUrl?: string;
    iosUrl?: string;
    androidUrl?: string;
    huaweiUrl?: string;
    fallbackUrl?: string;
    scheme?: string;
    iosUniversalUrl?: string;
    webhookUrl?: string;
    createdAt?: { $date?: string };
    updatedAt?: { $date?: string };
    __v?: number;
    adId?: { $oid?: string };
    metaData?: Record<string, any>;
    jid?: string;
}

export function toPropertiesDictionary(payload: PaylisherResolvedDeepLinkPayload): Record<string, any> {
    const properties: Record<string, any> = {
        _id: payload._id?.$oid || '',
        teamId: payload.teamId || '',
        projectId: payload.projectId || '',
        sourceId: payload.sourceId || '',
        type: payload.type || '',
        title: payload.title || '',
        keyName: payload.keyName || '',
        webUrl: payload.webUrl || '',
        iosUrl: payload.iosUrl || '',
        androidUrl: payload.androidUrl || '',
        huaweiUrl: payload.huaweiUrl || '',
        fallbackUrl: payload.fallbackUrl || '',
        scheme: payload.scheme || '',
        iosUniversalUrl: payload.iosUniversalUrl || '',
        webhookUrl: payload.webhookUrl || '',
        createdAt: payload.createdAt?.$date || '',
        updatedAt: payload.updatedAt?.$date || '',
        __v: payload.__v || 0,
        adId: payload.adId?.$oid || '',
        metaData: payload.metaData || {},
    };

    if (payload.jid) {
        properties.jid = payload.jid;
    }

    if (payload.metaData) {
        Object.keys(payload.metaData).forEach((key) => {
            properties[`meta_${key}`] = payload.metaData?.[key];
        });
    }

    return properties;
}

