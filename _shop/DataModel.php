<?php

use Firebase\JWT\JWT;

class DataModel {

   use Nette\SmartObject;

    private array $inMemoryCache = [];


   function __construct() {


       // pro testovani konkretni domeny
       if (@$_SERVER['SERVER_ADDR'] === '127.0.0.1' || @$_SERVER['SERVER_ADDR'] === '::1' || @$_SERVER['REMOTE_ADDR'] === '::1') {

           // zkontrolovat, jestli je soubor s nastavenim endpotinu - pripadne pouzit
           if(file_exists(WWW_ROOT."/../local_domena.txt")) {
               $domena = file_get_contents(WWW_ROOT."/../local_domena.txt");
               $_SERVER['HTTP_HOST'] = $domena;
           }

       }

   }

    public function internePripravCache() {
        $klic = "-".\Nette\Utils\Strings::webalize($_SERVER['HTTP_HOST']);
        //$klic = ""; // pokud je problem
        
        $cacheDir = WWW_ROOT."/../temp/data-cache".$klic;
    
        if (!is_dir($cacheDir)) {
            if (!mkdir($cacheDir, 0777, true)) {
                // Zpracujte chybu při vytváření složky
                throw new \Exception("Nepodařilo se vytvořit cache složku: " . $cacheDir);
            }
        }
    
        $storage = new Nette\Caching\Storages\FileStorage($cacheDir);
        return new Nette\Caching\Cache($storage);
    }

    private function ziskatDataApi($module = []) {

        $privateKey = <<<EOD
    -----BEGIN RSA PRIVATE KEY-----
    MIICXAIBAAKBgQC8kGa1pSjbSYZVebtTRBLxBz5H4i2p/llLCrEeQhta5kaQu/Rn
    vuER4W8oDH3+3iuIYW4VQAzyqFpwuzjkDI+17t5t0tyazyZ8JXw+KgXTxldMPEL9
    5+qVhgXvwtihXC1c5oGbRlEDvDF6Sa53rcFVsYJ4ehde/zUxo6UvS7UrBQIDAQAB
    AoGAb/MXV46XxCFRxNuB8LyAtmLDgi/xRnTAlMHjSACddwkyKem8//8eZtw9fzxz
    bWZ/1/doQOuHBGYZU8aDzzj59FZ78dyzNFoF91hbvZKkg+6wGyd/LrGVEB+Xre0J
    Nil0GReM2AHDNZUYRv+HYJPIOrB0CRczLQsgFJ8K6aAD6F0CQQDzbpjYdx10qgK1
    cP59UHiHjPZYC0loEsk7s+hUmT3QHerAQJMZWC11Qrn2N+ybwwNblDKv+s5qgMQ5
    5tNoQ9IfAkEAxkyffU6ythpg/H0Ixe1I2rd0GbF05biIzO/i77Det3n4YsJVlDck
    ZkcvY3SK2iRIL4c9yY6hlIhs+K9wXTtGWwJBAO9Dskl48mO7woPR9uD22jDpNSwe
    k90OMepTjzSvlhjbfuPN1IdhqvSJTDychRwn1kIJ7LQZgQ8fVz9OCFZ/6qMCQGOb
    qaGwHmUK6xzpUbbacnYrIM6nLSkXgOAwv7XXCojvY614ILTK3iXiLBOxPu5Eu13k
    eUz9sHyD6vkgZzjtxXECQAkp4Xerf5TGfQXGXhxIX52yH+N2LtujCdkQZjXAsGdm
    B2zNzvrlgRmgBrklMTrMYgm1NPcW+bRLGcwgW2PTvNM=
    -----END RSA PRIVATE KEY-----
    EOD;

        $api_volani = [];
        $api_volani[] = $module;

        \Tracy\Debugger::log('ziskatDataApi');
        \Tracy\Debugger::log(serialize($api_volani));


        $jwt = JWT::encode($api_volani, $privateKey, 'RS256');

        try {
            $client = new \GuzzleHttp\Client(['verify' => false]);
            $headers = [
                'content_type' => 'application/x-www-form-urlencoded',
                'body' => \json_encode($jwt)
            ];

            // prenastavit na localhost
            $domena = 'https://bob.kastomi.com/';

            if (@$_SERVER['SERVER_ADDR'] === '127.0.0.1' || @$_SERVER['SERVER_ADDR'] === '::1') {
               // $domena = 'https://loc/juxon/bob/web/';
                //$domena = 'https://bob.kastomi.com/';
            }

            $response = $client->request('POST', $domena.'api/v3/queue?_tracy_skip_error', $headers);

        }
        catch (\GuzzleHttp\Exception\BadResponseException $e) {

            dump($e);

            print "skonceno chybou:";
            print $e->getResponse()->getBody()->getContents();

            die("Synchronizace se nepodarila");

        }


        $body = $response->getBody()->getContents();

        //print $body;
        //exit;

        \Tracy\Debugger::$maxDepth = 8;
        bdump($body, 'body');
        //dump($body);

        $response = json_decode($body, true);

        bdump($response, 'response');



        // kdyby data byla prazdna - ale myslet na to na druhe strane
        if(isset($response['modules'][0]['data'])) {
            return $response['modules'][0]['data'];
        } else {
            return [];
        }

    }


    public function zive($co, $data_to_send = []) {

        if($co == "orderNumber") {

            $module = [];
            $module["module"] = "kastomi";
            $module["method"] = "orderNumber";
            $module["key"] = "get_".$module["method"]."_".time();

            $module["data"] = [];
            $module["data"]["url"] = $_SERVER['HTTP_HOST'];

            $data = $this->ziskatDataApi($module);

        }

        // muze prijit s web_order_number i s pay_id
        if($co == "orderPaymentData") {

            $module = [];
            $module["module"] = "kastomi";
            $module["method"] = "orderPaymentData";
            $module["key"] = "get_".$module["method"]."_".time();

            $module["data"] = [];
            $module["data"]["url"] = $_SERVER['HTTP_HOST'];

            foreach($data_to_send as $k => $v) {
                $module["data"][$k] = $v;
            }

            $data = $this->ziskatDataApi($module);

        }

        if($co == "orderPaymentId") {

            $module = [];
            $module["module"] = "kastomi";
            $module["method"] = "orderPaymentId";
            $module["key"] = "get_".$module["method"]."_".time();

            $module["data"] = [];
            $module["data"]["url"] = $_SERVER['HTTP_HOST'];

            foreach($data_to_send as $k => $v) {
                $module["data"][$k] = $v;
            }

            $data = $this->ziskatDataApi($module);

        }

        if($co == "orderSetPayment") {

            $module = [
                'module' => 'transaction',
                'method' => 'insert',
                'key' => 'platba_'.time(),
                'data' => [
                    'type' => 'credit_card',
                    'date' => date('Y-m-d H:i:s'),
                    'vs' => $data_to_send["order_id"],
                    'amount' => $data_to_send["amount"]
                ],
            ];

            $data = $this->ziskatDataApi($module);

        }






        return $data;

    }

    // neni potreba aktualizovat - nejake interni nastaveni, ktere se meni jen zridka, napsat pak system jak to invalidovat nejakym pozadavkem
    // v kazdem requestu je url
    // todo - sjednotit, nakonec skoro vsichni pouzivaji stejne volani
    public function zCache($co, $id = null, $critical = false, $cache_time = null) {

        if (isset($this->inMemoryCache[$co])) {
            //dump("vracim z memory cache ".$co);
            return $this->inMemoryCache[$co];
        }


        // todo do klice pridat identifikaci a tagy, abych mohl mazat
          $klic = $co."_".$id;

        $cache = $this->internePripravCache();

        // vracim z cache - jenom kdyz nemam, tak stahuju
        $data = $cache->load($klic);

        //$data = null;

        // pro testovani vynulovat - pak vzdy vola api
        if($cache_time == null) {
            $data = null;
        }

        if($data == null) {
            //dump("api call ".$co);
        } else {
            //dump("vracim z cache ".$co);
        }


        // pokud
        if ($data === null) {

             if($co == "salesChannelDashboard") {

                 $cast = explode(";", $id);

                 $module = [];
                 $module["module"] = "kastomi";
                 $module["method"] = "salesChannelDashboard";
                 $module["key"] = "get_".$module["method"]."_".time();

                 $module["data"] = [];
                 $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                 $module["data"]["from"] = $cast[0];
                 $module["data"]["to"] = $cast[1];

                 $data = $this->ziskatDataApi($module);

             }

            if($co == "orderNumber") {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "orderNumber";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesWebPages') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesWebPages";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesUsers') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesUsers";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesChannel') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesChannel";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == "salesChannelDelivery") {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesChannelDelivery";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesOrders') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesOrders";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesOffer') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesOffer";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesChannelSetting') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesChannelSetting";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }

            if($co == 'salesCategory') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "salesCategory";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }



            if($co == 'soubory') {

                $module = [];
                $module["module"] = "kastomi";
                $module["method"] = "soubory";
                $module["key"] = "get_".$module["method"]."_".time();

                $module["data"] = [];
                $module["data"]["url"] = $_SERVER['HTTP_HOST'];

                $data = $this->ziskatDataApi($module);

            }


            // stahnout - kdyz se nepovede, tak se rozhodnout podle critical
            if($critical === true && isset($nepovedlo_se_ziskat_data)) {
                throw new Exception("Nepovedlo se ziskat data");
            }

            if($cache_time != null) {
                $cache->save($klic, $data, [
                    \Nette\Caching\Cache::EXPIRE => $cache_time, // akceptuje i sekundy nebo timestamp
                ]);
            }

            $this->inMemoryCache[$co] = $data;

            return $data;

        } else {
            return $data;
        }


    }

    public function odeslat($co, $data = []) {

        $module = [];
        $module["module"] = "kastomi";
        $module["method"] = $co;
        $module["key"] = "set_".$module["method"]."_".time();

        $module["data"] = $data;
        $module["data"]["url"] = $_SERVER['HTTP_HOST'];

        $data = $this->ziskatDataApi($module);


        return $data;

    }


    public function ziveNeboZCache($co, $id = null) {

        $cache = $this->internePripravCache();


        $data = $cache->load($co);


    }


}
